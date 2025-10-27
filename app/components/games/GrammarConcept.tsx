import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Lightbulb, Volume2, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"
import { getGrammarConcept, GrammarPhase, UseItExample, UseItInputExample, UseItQuizExample } from "@/lib/config/grammar-concepts"
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
  const [practicePhaseIndex, setPracticePhaseIndex] = useState(0) // Track which phase in Practice tab
  const [useItExampleIndex, setUseItExampleIndex] = useState(0) // Track which example in Use It tab
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [useItInput, setUseItInput] = useState('')
  const [useItQuizAnswer, setUseItQuizAnswer] = useState<number | null>(null)

  const concept = getGrammarConcept(conceptId)
  
  if (!concept) {
    console.error(`Grammar concept not found: ${conceptId}`)
    return null
  }

  const currentPracticePhase = concept.phases[practicePhaseIndex]
  const isLastPracticePhase = practicePhaseIndex === concept.phases.length - 1
  
  // Use new useItExamples if available, fallback to legacy useItSentence
  const useItExamples = concept.useItExamples || []
  const currentUseItExample = useItExamples[useItExampleIndex]
  const isLastUseItExample = useItExampleIndex === useItExamples.length - 1
  
  const tabs = [
    { id: 0, label: "The Rule", icon: "📚" },
    { id: 1, label: "Examples", icon: "📝" },
    { id: 2, label: "Practice", icon: "✏️" },
    { id: 3, label: "Use It", icon: "💬" }
  ]

  // Split word to show base + suffix with different colors
  const splitWordWithSuffix = (base: string, transformed: string) => {
    const hyphenated = transformed.includes('-') ? transformed : `${base}-${transformed.replace(base, '')}`
    
    // Special handling for connector suffix (e/ye): only highlight the suffix, not the next word
    if (hyphenated.includes('esm-e') || hyphenated.includes('chi-ye')) {
      const parts = hyphenated.split(/\s+/)
      if (parts.length > 1) {
        // Find which part has the hyphen
        const hyphenatedPart = parts.find(p => p.includes('-'))
        if (hyphenatedPart) {
          const [baseWord, suffix] = hyphenatedPart.split('-')
          const remainingWords = parts.filter(p => p !== hyphenatedPart).join(' ')
          return { 
            basePart: baseWord + (remainingWords ? ' ' + remainingWords : ''), 
            suffixPart: suffix 
          }
        }
      }
    }
    
    const [basePart, suffixPart] = hyphenated.split('-')
    return { basePart, suffixPart: suffixPart || '' }
  }
  
  // Extract just the suffix (e/ye) for button display
  const getSuffixForButton = (baseWord: string, transformedWord: string) => {
    // Special handling for connector
    if (transformedWord.includes('esm-e') || transformedWord.includes('chi-ye')) {
      return 'e'
    }
    // For other cases, extract suffix after base word
    return transformedWord.replace(baseWord, '').replace(/-/g, '').trim()
  }

  // Play audio for a word
  const playExampleAudio = (word: string) => {
    // Remove hyphens before playing audio
    const audioId = word.replace(/-/g, '')
    AudioService.playAudio(`/audio/${audioId}.mp3`)
  }

  // Handle Practice transformation button
  const handleTransform = async () => {
    setShowTransformation(true)
    playSuccessSound()
  }

  // Handle moving to next practice phrase
  const handleNextPracticePhrase = () => {
    if (isLastPracticePhase) {
      // Auto-advance to Use It tab
      setActiveTab(3)
    } else {
      setPracticePhaseIndex(prev => prev + 1)
      setShowTransformation(false)
    }
  }

  // Handle Use It input submission
  const handleUseItInputSubmit = (example: UseItInputExample) => {
    const suffix = example.targetSuffix.toLowerCase().trim()
    if (useItInput.toLowerCase().trim() === suffix) {
      playSuccessSound()
      // Move to next example or complete
      if (isLastUseItExample) {
        handleCompleteGrammarConcept()
      } else {
        // Auto-advance to next example after brief delay
    setTimeout(() => {
          setUseItExampleIndex(prev => prev + 1)
          setUseItInput('')
    }, 800)
  }
    }
  }

  // Handle Use It quiz submission
  const handleUseItQuizSubmit = (example: UseItQuizExample) => {
    if (useItQuizAnswer === example.correctIndex) {
      playSuccessSound()
      // Move to next example or complete
      if (isLastUseItExample) {
        handleCompleteGrammarConcept()
      } else {
        setTimeout(() => {
          setUseItExampleIndex(prev => prev + 1)
          setUseItQuizAnswer(null)
        }, 800)
      }
    }
  }

  // Handle complete grammar concept (award XP here)
  const handleCompleteGrammarConcept = async () => {
    // Award XP
    if (onXpStart) {
      const wasGranted = await onXpStart()
      setIsAlreadyCompleted(!wasGranted)
    }
    
    // Show XP animation
    setShowXp(true)
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 relative">
      {/* XP Animation */}
      <XpAnimation 
        amount={points} 
        show={showXp} 
        isAlreadyCompleted={isAlreadyCompleted}
        onComplete={() => {
          setShowXp(false)
          onComplete(true)
        }} 
      />

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-center gap-2">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`h-1 flex-1 rounded-full transition-all ${
                activeTab === tab.id
                  ? 'bg-primary'
                  : activeTab > tab.id
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* Tab 1: The Rule (Problem) - Tree Map */}
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
                  {concept.title}
              </h3>
                {/* Badge for suffix type (shared) */}
                {concept.phases[0]?.suffixType && (
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      concept.phases[0].suffixType === 'state' 
                        ? 'bg-blue-100 text-blue-800' 
                        : concept.phases[0].suffixType === 'possession'
                        ? 'bg-green-100 text-green-800'
                        : concept.phases[0].suffixType === 'question'
                        ? 'bg-purple-100 text-purple-800'
                        : concept.phases[0].suffixType === 'connector'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {concept.phases[0].suffixType.charAt(0).toUpperCase() + concept.phases[0].suffixType.slice(1)}
                    </span>
                  </div>
                )}
                <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                  {concept.rule}
            </p>
          </div>

              {/* Tree map: Base word at top, transformations below */}
              <div className="flex flex-col items-center space-y-4 py-6">
                {/* Base word (root) */}
                <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-800">
                    {concept.phases[0].baseWord}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {concept.phases[0].baseDefinition}
                  </div>
                </div>

                {/* Connector lines */}
                <div className="flex justify-center">
                  <div className="h-6 w-0.5 bg-gray-300"></div>
                </div>

                {/* Transformations (branches) */}
                <div className="flex justify-center gap-3 flex-wrap">
                  {concept.phases.map((phase, index) => {
                    const { basePart, suffixPart } = splitWordWithSuffix(phase.baseWord, phase.transformedWord)
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 min-w-[130px]">
                          <div className="text-lg font-bold text-green-700">
                            <span>{basePart}</span>
                            <span className="text-orange-600">-{suffixPart}</span>
                            {phase.transformedWord.includes('?') && <span className="text-orange-600">?</span>}
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            {phase.transformedDefinition}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                </div>

              <div className="text-center">
                <Button
                  onClick={() => setActiveTab(1)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  See Examples
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Examples - All phases as separate items */}
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
                  Real Examples
                </h3>
                <p className="text-gray-600 mb-6">
                  {concept.description}
                </p>
              </div>

              <div className="space-y-4">
                {concept.phases.map((phase, index) => {
                  const { basePart, suffixPart } = splitWordWithSuffix(phase.baseWord, phase.transformedWord)
                  const isQuestion = phase.transformedWord.includes('?')
                  return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-blue-700">
                          <span>{basePart}</span>
                          <span className="text-orange-600">-{suffixPart}</span>
                          {isQuestion && <span className="text-orange-600 font-extrabold">?</span>}
                        </div>
                        <div>
                          <div className="text-sm text-gray-700">{phase.transformedDefinition}</div>
                          <div className="text-xs text-gray-500 mt-1">{phase.explanation}</div>
                      </div>
                    </div>
                    <Button
                        onClick={() => playExampleAudio(phase.transformedWord.replace(/-/g, '').replace('?', ''))}
                  variant="outline"
                  size="sm"
                        className="gap-2 border-blue-300 text-blue-700"
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  </motion.div>
                  )
                })}
              </div>

              <div className="text-center">
                <Button
                  onClick={() => setActiveTab(2)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Practice Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Practice - Sequential, one at a time */}
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
                  Practice: {currentPracticePhase.explanation}
                </h3>
                {/* Badge for current phase */}
                {currentPracticePhase.suffixType && (
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      currentPracticePhase.suffixType === 'state' 
                        ? 'bg-blue-100 text-blue-800' 
                        : currentPracticePhase.suffixType === 'possession'
                        ? 'bg-green-100 text-green-800'
                        : currentPracticePhase.suffixType === 'question'
                        ? 'bg-purple-100 text-purple-800'
                        : currentPracticePhase.suffixType === 'connector'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {currentPracticePhase.suffixType.charAt(0).toUpperCase() + currentPracticePhase.suffixType.slice(1)}
                    </span>
                  </div>
                )}
                <p className="text-gray-600 mb-6">
                  Transform "{currentPracticePhase.baseWord}" into "{currentPracticePhase.transformedWord.replace(/-/g, '')}"
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 py-8">
                <div className="text-center">
                  <div className="bg-gray-100 rounded-lg p-6">
                    <div className="text-3xl font-bold text-gray-800 mb-2">{currentPracticePhase.baseWord}</div>
                    <div className="text-sm text-gray-600">{currentPracticePhase.baseDefinition}</div>
                  </div>
                </div>

            <div className="flex flex-col items-center">
              {!showTransformation ? (
                <Button
                  onClick={handleTransform}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white px-6 py-3 text-lg"
                >
                      {getSuffixForButton(currentPracticePhase.baseWord, currentPracticePhase.transformedWord) 
                        ? `+ -${getSuffixForButton(currentPracticePhase.baseWord, currentPracticePhase.transformedWord)}` 
                        : '+ -'}
                </Button>
              ) : (
                    <div className="text-4xl font-bold text-green-600">✓</div>
              )}
            </div>

            <div className="text-center">
              <AnimatePresence>
                    {showTransformation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-100 rounded-lg p-6"
                      >
                        <div className="text-3xl font-bold text-green-700 mb-2">
                          {(() => {
                            const { basePart, suffixPart } = splitWordWithSuffix(currentPracticePhase.baseWord, currentPracticePhase.transformedWord)
                            return (
                              <>
                                <span>{basePart}</span>
                                <span className="text-orange-600">-{suffixPart}</span>
                              </>
                            )
                          })()}
                        </div>
                        <div className="text-sm text-green-600">{currentPracticePhase.transformedDefinition}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

            {showTransformation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
              >
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium">
                      Perfect! {currentPracticePhase.exampleBefore} → {currentPracticePhase.exampleAfter}
                </p>
                    </div>

                  {isLastPracticePhase ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Great job! Now let's use it in real sentences →
                      </p>
                          <Button
                        onClick={handleNextPracticePhrase}
                        className="bg-accent hover:bg-accent/90 text-white px-8 py-3"
                          >
                        Try Using It
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                    </div>
                        ) : (
                          <Button
                      onClick={handleNextPracticePhrase}
                      className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
                          >
                      Next Phrase ({practicePhaseIndex + 1}/{concept.phases.length})
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}

          {/* Tab 4: Use It - Multi-example with progression */}
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
                  Use It in Context
                </h3>
                <p className="text-gray-600 mb-6">
                  Example {useItExampleIndex + 1} of {useItExamples.length}
                </p>
              </div>

              {currentUseItExample && currentUseItExample.type === 'input' && (
                <div className="space-y-6">
                  {/* Sentence with blank */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <p className="text-xl font-bold text-blue-700 mb-2">
                      {currentUseItExample.sentence}
                    </p>
                    <p className="text-sm text-gray-600">
                      {currentUseItExample.translation}
                    </p>
                  </div>

                  {/* Input field with letter-by-letter feedback */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      What suffix goes after "{currentUseItExample.baseWord}"?
                    </label>
                    {(() => {
                      const targetSuffix = currentUseItExample.targetSuffix.toLowerCase()
                      const inputValue = useItInput.toLowerCase()
                      
                      const validateChar = (char: string, index: number): 'correct' | 'incorrect' | 'pending' => {
                        if (index >= inputValue.length) return 'pending'
                        if (index >= targetSuffix.length) return 'incorrect'
                        return inputValue[index] === targetSuffix[index] ? 'correct' : 'incorrect'
                      }
                      
                      return (
                        <div className="w-full space-y-3">
                          {/* Regular visible input */}
                          <input
                            type="text"
                            value={useItInput}
                            onChange={(e) => setUseItInput(e.target.value)}
                            className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-2xl font-bold text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            placeholder="Type suffix here..."
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            autoFocus
                          />
                          
                          {/* Letter-by-letter feedback below */}
                          <div className="flex flex-wrap gap-2 justify-center">
                            {targetSuffix.split('').map((char, index) => {
                              const status = validateChar(char, index)
                              return (
                                <motion.span
                                  key={index}
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-lg font-bold transition-all ${
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

                  <Button
                    onClick={() => handleUseItInputSubmit(currentUseItExample)}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-3"
                  >
                    {isLastUseItExample ? 'Complete Grammar Concept' : 'Check Answer'}
                  </Button>
                </div>
              )}

              {currentUseItExample && currentUseItExample.type === 'quiz' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <p className="text-lg font-semibold text-gray-800 mb-4">
                      {currentUseItExample.question}
                    </p>
                    <div className="space-y-3">
                      {currentUseItExample.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => setUseItQuizAnswer(index)}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                            useItQuizAnswer === index
                              ? index === currentUseItExample.correctIndex
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-primary'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {useItQuizAnswer !== null && (
                    <Button
                      onClick={() => handleUseItQuizSubmit(currentUseItExample)}
                      className="w-full bg-primary hover:bg-primary/90 text-white py-3"
                      disabled={useItQuizAnswer !== currentUseItExample.correctIndex}
                    >
                      {isLastUseItExample ? 'Complete Grammar Concept' : 'Next Example'}
                    </Button>
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
