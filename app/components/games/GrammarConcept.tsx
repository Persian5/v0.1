import { useState, useEffect } from "react"
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
  onXpStart?: () => void;
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

  const concept = getGrammarConcept(conceptId)
  
  if (!concept) {
    console.error(`Grammar concept not found: ${conceptId}`)
    return null
  }

  const currentPhase = concept.phases[0] // Using first phase for simplicity
  
  const tabs = [
    { id: 0, label: "Problem", icon: "🤔" },
    { id: 1, label: "Examples", icon: "📝" },
    { id: 2, label: "Practice", icon: "🎯" }
  ]

  // Dynamic examples based on concept
  const getExamples = () => {
    if (conceptId === "ezafe-connector") {
      return [
        { persian: "esme man", english: "my name" },
        { persian: "esme shoma", english: "your name" },
        { persian: "esme Sara", english: "Sara's name" }
      ]
    } else if (conceptId === "verb-contraction") {
      return [
        { persian: "chi", english: "what" },
        { persian: "chiye", english: "what is it?" },
        { persian: "chiye in", english: "what is this?" }
      ]
    }
    return []
  }

  const examples = getExamples()

  // Dynamic problem content based on concept
  const getProblemContent = () => {
    if (conceptId === "ezafe-connector") {
      return {
        title: "The Problem with \"esm\"",
        wrongExample: { text: "esm man", translation: "\"name me\"", note: "❌ Unnatural" },
        rightExample: { text: "esme man", translation: "\"my name\"", note: "✅ Natural" },
        explanation: "In Persian, we connect words with a little sound called \"-e\". So instead of saying esm man (\"name me\"), we say esme man (\"my name\")."
      }
    } else if (conceptId === "verb-contraction") {
      return {
        title: "The Problem with \"chi\"", 
        wrongExample: { text: "chi", translation: "\"what\"", note: "❌ Too general" },
        rightExample: { text: "chiye", translation: "\"what is it?\"", note: "✅ Specific" },
        explanation: "In Persian, we add \"-ye\" (shortened form of 'is') to ask about specific things. So instead of saying chi (\"what\"), we say chiye (\"what is it?\")."
      }
    }
    return null
  }

  const problemContent = getProblemContent()

  // Dynamic practice content based on concept  
  const getPracticeContent = () => {
    if (conceptId === "ezafe-connector") {
      return {
        title: "Practice: Add the \"-e\"",
        description: "Transform \"esm\" into \"esme\" by adding the connecting sound",
        baseWord: { text: "esm", translation: "\"name\"" },
        transformedWord: { text: "esme", translation: "\"name of\"" },
        buttonText: "+ e",
        successTitle: "Perfect! You added the ezāfe sound!",
        successDescription: "Now you can say \"esme man\" (my name) naturally"
      }
    } else if (conceptId === "verb-contraction") {
      return {
        title: "Practice: Add the \"-ye\"",
        description: "Transform \"chi\" into \"chiye\" by adding the verb ending",
        baseWord: { text: "chi", translation: "\"what\"" },
        transformedWord: { text: "chiye", translation: "\"what is it?\"" },
        buttonText: "+ ye", 
        successTitle: "Perfect! You added the verb ending!",
        successDescription: "Now you can ask \"chiye?\" (what is it?) about specific things"
      }
    }
    return null
  }

  const practiceContent = getPracticeContent()

  // Dynamic header content based on concept
  const getHeaderContent = () => {
    if (conceptId === "ezafe-connector") {
      return {
        title: "Why do we say \"esme\", not \"esm\"?",
        subtitle: "Learn about Persian's connecting sound: ezāfe"
      }
    } else if (conceptId === "verb-contraction") {
      return {
        title: "Why do we say \"chiye\", not \"chi\"?", 
        subtitle: "Learn about Persian's verb contractions: adding \"-ye\""
      }
    }
    return {
      title: concept.title,
      subtitle: "Learn about Persian grammar"
    }
  }

  const headerContent = getHeaderContent()

  const handleTransform = async () => {
    if (showTransformation) return
    
    try {
      await AudioService.playVocabularyAudio(currentPhase.transformedWord, 'persian')
    } catch (error) {
      console.log('Audio playback error:', error)
    }
    
    setShowTransformation(true)
    playSuccessSound()
    
    if (onXpStart) {
      onXpStart()
    }
    
    setShowXp(true)
    
    setTimeout(() => {
      setPracticeComplete(true)
    }, 800)
  }

  const playExampleAudio = async (text: string) => {
    try {
      await AudioService.playVocabularyAudio(text, 'persian')
    } catch (error) {
      console.log('Audio playback error:', error)
    }
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
                    <div className="text-lg font-bold text-green-700 mb-1">{problemContent?.rightExample.text}</div>
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
                  Real Examples of Ezāfe
                </h3>
                <p className="text-gray-600 mb-6">
                  See how the "-e" sound connects words in everyday Persian
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
                        {example.persian}
                      </div>
                      <div className="text-gray-600">=</div>
                      <div className="text-gray-700">
                        {example.english}
                      </div>
                    </div>
                    <Button
                      onClick={() => playExampleAudio(example.persian)}
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
                        <div className="text-3xl font-bold text-green-700 mb-2">{practiceContent?.transformedWord.text}</div>
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
                      >
                        <Button
                          onClick={handleComplete}
                          className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-semibold"
                        >
                          Complete Grammar Lesson
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 