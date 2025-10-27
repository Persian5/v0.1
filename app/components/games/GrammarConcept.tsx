import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Lightbulb, Volume2, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"
import { getGrammarConcept, GrammarPhase } from "@/lib/config/grammar-concepts"
import { AudioService } from "@/lib/services/audio-service"

export interface GrammarConceptProps {
  conceptId: string;
  points?: number;
  onComplete: (correct: boolean) => void;
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed;
}

export function GrammarConcept({ 
  conceptId,
  points = 2,
  onComplete,
  onXpStart
}: GrammarConceptProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [showTransformation, setShowTransformation] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [practiceComplete, setPracticeComplete] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)
  const [useItInput, setUseItInput] = useState('')
  const [useItCorrect, setUseItCorrect] = useState(false)

  const concept = getGrammarConcept(conceptId)
  
  if (!concept) {
    console.error(`Grammar concept not found: ${conceptId}`)
    return null
  }

  const currentPhase = concept.phases[currentPhaseIndex]
  const isLastPhase = currentPhaseIndex === concept.phases.length - 1
  
  const tabs = [
    { id: 0, label: "The Rule", icon: "📚" },
    { id: 1, label: "Examples", icon: "📝" },
    { id: 2, label: "Practice", icon: "✏️" },
    { id: 3, label: "Use It", icon: "💬" }
  ]

  // Dynamic examples from all phases - include hyphenated version for suffix highlighting
  const examples = concept.phases.map(phase => ({
    persian: phase.transformedWord, // Keep hyphen for splitWordWithSuffix
    english: phase.transformedDefinition,
    baseWord: phase.baseWord
  }))

  // Dynamic problem content from current phase
  const problemContent = {
    title: concept.title,
    wrongExample: { 
      text: currentPhase.baseWord, 
      translation: currentPhase.baseDefinition, 
      note: "❌ Before" 
    },
    rightExample: { 
      text: currentPhase.transformedWord, // Keep hyphen for splitWordWithSuffix
      translation: currentPhase.transformedDefinition, 
      note: "✅ After" 
    },
    explanation: currentPhase.explanation
  }

  // Extract button text from transformation (e.g., "esm" → "esm-am" = "+ am")
  const getButtonText = (base: string, transformed: string) => {
    const suffix = transformed.replace(base, '').replace(/-/g, '').trim()
    return `+ ${suffix}`
  }

  // Split word to show base + suffix with different colors
  const splitWordWithSuffix = (base: string, transformed: string) => {
    const hyphenated = transformed.includes('-') ? transformed : `${base}-${transformed.replace(base, '')}`
    const [basePart, suffixPart] = hyphenated.split('-')
    return { basePart, suffixPart: suffixPart || '' }
  }

  // Dynamic practice content from current phase
  const practiceContent = {
    title: `Practice: ${currentPhase.explanation}`,
    description: `Transform "${currentPhase.baseWord}" into "${currentPhase.transformedWord.replace(/-/g, '')}"`,
    baseWord: { 
      text: currentPhase.baseWord, 
      translation: currentPhase.baseDefinition 
    },
    transformedWord: { 
      text: currentPhase.transformedWord.replace(/-/g, ''), 
      translation: currentPhase.transformedDefinition 
    },
    buttonText: getButtonText(currentPhase.baseWord, currentPhase.transformedWord),
    successTitle: "Perfect! You transformed it correctly!",
    successDescription: `${currentPhase.exampleBefore} → ${currentPhase.exampleAfter}`
  }

  // Dynamic header content from concept data
  const headerContent = {
    title: concept.title,
    subtitle: concept.description
  }

  const handleTransform = async () => {
    if (showTransformation) return
    
    try {
      // Remove hyphens for audio playback (e.g., "esm-am" → "esmam")
      const audioId = currentPhase.transformedWord.replace(/-/g, '')
      await AudioService.playVocabularyAudio(audioId)
    } catch (error) {
      console.log('Audio playback error:', error)
    }
    
    setShowTransformation(true)
    playSuccessSound()
    
    if (onXpStart) {
      const wasGranted = await onXpStart(); // Await the Promise to get result
      setIsAlreadyCompleted(!wasGranted); // If not granted, it was already completed
    }
    
    setShowXp(true)
    
    setTimeout(() => {
      setPracticeComplete(true)
    }, 800)
  }

  const playExampleAudio = async (text: string) => {
    try {
      await AudioService.playVocabularyAudio(text)
    } catch (error) {
      console.log('Audio playback error:', error)
    }
  }

  const handleNextPhase = () => {
    // Move to next phase but keep current tab active (don't reset to Problem tab)
    setCurrentPhaseIndex(prev => prev + 1)
    setShowTransformation(false)
    setPracticeComplete(false)
    // Keep activeTab as-is so user can continue with same tab (Problem/Examples/Practice)
  }

  const handleComplete = () => {
    onComplete(true)
  }

  const handleXpComplete = () => {
    setShowXp(false)
  }

  return (
    <div className="w-full max-w-[90vw] sm:max-w-[80vw] mx-auto py-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-primary">
          {headerContent.title}
        </h2>
        <p className="text-muted-foreground text-sm">
          {headerContent.subtitle}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg p-6 min-h-[400px]">
        <XpAnimation 
          amount={currentPhase.points} 
          show={showXp}
          isAlreadyCompleted={isAlreadyCompleted}
          onStart={undefined}
          onComplete={handleXpComplete}
        />
        
        <AnimatePresence mode="wait">
          {/* Tab 1: Problem */}
          {activeTab === 0 && (
            <motion.div
              key="problem"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
          <div className="text-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  {problemContent?.title}
              </h3>
                <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                  {problemContent?.explanation}
            </p>
          </div>

              <div className="flex justify-center gap-8 py-6">
                {/* Wrong way */}
                <div className="text-center">
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-2">
                    <div className="text-lg font-bold text-red-700 mb-1">{problemContent?.wrongExample.text}</div>
                    <div className="text-sm text-red-600">{problemContent?.wrongExample.translation}</div>
                    <div className="text-xs text-red-500 mt-2">{problemContent?.wrongExample.note}</div>
                  </div>
                </div>

                <div className="flex items-center text-2xl">→</div>

                {/* Right way */}
                <div className="text-center">
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-2">
                    <div className="text-lg font-bold text-green-700 mb-1">
                      {(() => {
                        const { basePart, suffixPart } = splitWordWithSuffix(currentPhase.baseWord, currentPhase.transformedWord)
                        return (
                          <>
                            <span>{basePart}</span>
                            <span className="text-orange-600">-{suffixPart}</span>
                          </>
                        )
                      })()}
                    </div>
                    <div className="text-sm text-green-600">{problemContent?.rightExample.translation}</div>
                    <div className="text-xs text-green-500 mt-2">{problemContent?.rightExample.note}</div>
                  </div>
                </div>
                </div>

              <div className="text-center">
                <Button
                  onClick={() => setActiveTab(1)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  See More Examples
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Examples */}
          {activeTab === 1 && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  Real Examples of {concept.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {concept.description}
                </p>
              </div>

              <div className="space-y-4">
                {examples.map((example, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-blue-700">
                        {(() => {
                          const { basePart, suffixPart } = splitWordWithSuffix(example.baseWord, example.persian)
                          return (
                            <>
                              <span>{basePart}</span>
                              <span className="text-orange-600">-{suffixPart}</span>
                            </>
                          )
                        })()}
                      </div>
                      <div className="text-gray-600">=</div>
                      <div className="text-gray-700">
                        {example.english}
                      </div>
                    </div>
                    <Button
                      onClick={() => playExampleAudio(example.persian.replace(/-/g, ''))}
                  variant="outline"
                  size="sm"
                      className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  onClick={() => setActiveTab(2)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Try It Yourself
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Practice */}
          {activeTab === 2 && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  {practiceContent?.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {practiceContent?.description}
                </p>
              </div>

              {/* Simplified transformation area */}
              <div className="flex items-center justify-center gap-6 py-8">
                <div className="text-center">
                  <div className="bg-gray-100 rounded-lg p-6">
                    <div className="text-3xl font-bold text-gray-800 mb-2">{practiceContent?.baseWord.text}</div>
                    <div className="text-sm text-gray-600">{practiceContent?.baseWord.translation}</div>
                  </div>
                </div>

            <div className="flex flex-col items-center">
              {!showTransformation ? (
                <Button
                  onClick={handleTransform}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-semibold transition-all hover:scale-105"
                >
                      {practiceContent?.buttonText}
                </Button>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-500"
                >
                      <CheckCircle className="h-8 w-8" />
                </motion.div>
              )}
            </div>

            <div className="text-center">
              <AnimatePresence>
                {showTransformation ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border-2 border-green-200 rounded-lg p-6"
                      >
                        <div className="text-3xl font-bold text-green-700 mb-2">
                          {(() => {
                            const { basePart, suffixPart } = splitWordWithSuffix(currentPhase.baseWord, currentPhase.transformedWord)
                            return (
                              <>
                                <span>{basePart}</span>
                                <span className="text-orange-600">-{suffixPart}</span>
                              </>
                            )
                          })()}
                        </div>
                        <div className="text-sm text-green-600">{practiceContent?.transformedWord.translation}</div>
                  </motion.div>
                ) : (
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 w-[120px] h-[120px] flex items-center justify-center">
                        <div className="text-gray-400 text-sm text-center">
                          Click {practiceContent?.buttonText}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

              {/* Success message and completion */}
          <AnimatePresence>
            {showTransformation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
              >
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium">
                        {practiceContent?.successTitle}
                </p>
                      <p className="text-green-600 text-sm mt-1">
                        {practiceContent?.successDescription}
                </p>
                    </div>

                    {practiceComplete && (
              <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4 justify-center"
              >
                        {!isLastPhase ? (
                          <Button
                            onClick={handleNextPhase}
                            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-semibold"
                          >
                            Next Phase ({currentPhaseIndex + 1}/{concept.phases.length})
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 mb-2">
                              Great job! Now try using it in a real sentence →
                            </p>
                            <Button
                              onClick={() => setActiveTab(3)}
                              className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-semibold"
                            >
                              Go to "Use It" Tab
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              </motion.div>
            )}

          {/* Tab 4: Use It */}
          {activeTab === 3 && (
            <motion.div
              key="use-it"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  Try It in a Real Sentence
                </h3>
                <p className="text-gray-600 mb-6">
                  Fill in the blank to complete the sentence
                </p>
              </div>

              {concept.useItSentence && (
                <div className="space-y-6">
                  {/* Sentence with blank - show context but hide which suffix */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <p className="text-xl font-bold text-blue-700 mb-2">
                      {(() => {
                        // Show sentence with blank for suffix - include context words
                        const sentence = concept.useItSentence.split('(')[0].trim()
                        const { basePart } = splitWordWithSuffix(currentPhase.baseWord, currentPhase.transformedWord)
                        // Replace the word (with or without hyphen) with "base-___"
                        // Handle both "khoobam" and "khoob-am"
                        const wordWithoutHyphen = currentPhase.transformedWord.replace(/-/g, '')
                        const replaceWord = wordWithoutHyphen
                        return sentence.replace(replaceWord, `${basePart}-___`)
                      })()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {concept.useItSentence.split('(')[1]?.replace(')', '')}
                    </p>
                  </div>

                  {/* Input field with letter-by-letter feedback */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      What suffix goes after "{currentPhase.baseWord}" to make this sentence correct?
                    </label>
                    {(() => {
                      const targetSuffix = currentPhase.transformedWord
                        .replace(currentPhase.baseWord, '')
                        .replace(/-/g, '')
                        .trim()
                        .toLowerCase()
                      
                      const inputValue = useItInput.toLowerCase()
                      
                      // Validate each character
                      const validateChar = (char: string, index: number): 'correct' | 'incorrect' | 'pending' => {
                        if (index >= inputValue.length) return 'pending'
                        if (index >= targetSuffix.length) return 'incorrect'
                        return inputValue[index] === targetSuffix[index] ? 'correct' : 'incorrect'
                      }
                      
                      return (
                        <div className="relative w-full">
                          {/* Hidden input for actual typing */}
                          <input
                            type="text"
                            value={useItInput}
                            onChange={(e) => setUseItInput(e.target.value)}
                            className="absolute opacity-0 w-full h-0"
                            disabled={useItCorrect}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            ref={(el) => {
                              if (el && !useItCorrect) {
                                setTimeout(() => el.focus(), 100)
                              }
                            }}
                          />
                          {/* Visual letter-by-letter feedback display */}
                          <div className="flex flex-wrap gap-1 justify-center mt-2">
                            {targetSuffix.split('').map((char, index) => {
                              const status = validateChar(char, index)
                              return (
                                <motion.span
                                  key={index}
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  onClick={() => !useItCorrect && document.querySelector('input[type="text"]')?.focus()}
                                  className={`inline-flex items-center justify-center min-w-[40px] h-[50px] rounded-lg text-lg font-bold transition-all cursor-text ${
                                    status === 'correct' 
                                      ? 'bg-green-100 text-green-700 border-2 border-green-500' 
                                      : status === 'incorrect'
                                      ? 'bg-red-100 text-red-700 border-2 border-red-500'
                                      : 'bg-gray-50 text-gray-400 border-2 border-gray-300'
                                  }`}
                                >
                                  {status === 'pending' ? '_' : inputValue[index] || ''}
                                </motion.span>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Submit button */}
                  {!useItCorrect && (
                    <Button
                      onClick={() => {
                        // Check if input matches current phase suffix
                        const suffix = currentPhase.transformedWord
                          .replace(currentPhase.baseWord, '')
                          .replace(/-/g, '')
                          .trim()
                        
                        if (useItInput.toLowerCase() === suffix.toLowerCase()) {
                          setUseItCorrect(true)
                          playSuccessSound()
                        }
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-white py-3"
                    >
                      Check Answer
                    </Button>
                  )}

                  {/* Success message */}
                  {useItCorrect && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-4"
                    >
                      <div>
                        <p className="text-green-800 font-semibold mb-4">
                          Perfect! You got it right!
                        </p>
                        {/* Show full sentence with highlighted suffix */}
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="text-xl font-bold text-gray-800 mb-2">
                            Full sentence:
                          </p>
                          <p className="text-2xl font-bold">
                            {(() => {
                              const sentence = concept.useItSentence.split('(')[0].trim()
                              const { basePart, suffixPart } = splitWordWithSuffix(currentPhase.baseWord, currentPhase.transformedWord)
                              const fullWord = `${basePart}-${suffixPart}`
                              const highlightedWord = fullWord.replace(/-/g, '')
                              
                              // Split sentence and highlight the word
                              const parts = sentence.split(highlightedWord)
                              
                              return (
                                <>
                                  {parts[0]}
                                  <span className="text-orange-600">{highlightedWord}</span>
                                  {parts[1]}
                                </>
                              )
                            })()}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            {concept.useItSentence.split('(')[1]?.replace(')', '')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => playExampleAudio(currentPhase.transformedWord.replace(/-/g, ''))}
                          variant="outline"
                          className="gap-2 border-green-300 text-green-700 hover:bg-green-100"
                        >
                          <Volume2 className="h-4 w-4" />
                          Hear It
                        </Button>
                        
                        {isLastPhase && (
                          <Button
                            onClick={handleComplete}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2"
                          >
                            Complete Lesson
                            <CheckCircle className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
      </div>
    </div>
  )
} 