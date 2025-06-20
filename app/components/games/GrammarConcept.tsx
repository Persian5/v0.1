import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Lightbulb } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"
import { getGrammarConcept, GrammarPhase } from "@/lib/config/grammar-concepts"

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
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [showTransformation, setShowTransformation] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [phaseComplete, setPhaseComplete] = useState(false)

  const concept = getGrammarConcept(conceptId)
  
  if (!concept) {
    console.error(`Grammar concept not found: ${conceptId}`)
    return null
  }

  const currentPhase = concept.phases[currentPhaseIndex]
  const isLastPhase = currentPhaseIndex === concept.phases.length - 1
  
  // Determine the suffix being added based on the transformation
  const getSuffix = () => {
    const base = currentPhase.baseWord
    const transformed = currentPhase.transformedWord
    if (transformed.startsWith(base)) {
      return transformed.slice(base.length)
    }
    return "-e" // fallback
  }
  
  const suffix = getSuffix()

  const handleTransform = () => {
    if (showTransformation) return // Prevent double-click
    
    setShowTransformation(true)
    
    // Play success sound when transformation happens
    playSuccessSound()
    
    // Award XP immediately when user transforms word
    if (onXpStart) {
      onXpStart()
    }
    
    // Show XP animation
    setShowXp(true)
    
    // Mark phase as complete after animation
    setTimeout(() => {
      setPhaseComplete(true)
    }, 800)
  }

  const handleContinue = () => {
    if (isLastPhase) {
      // Completed all phases
      onComplete(true)
    } else {
      // Move to next phase
      setCurrentPhaseIndex(prev => prev + 1)
      setShowTransformation(false)
      setPhaseComplete(false)
      setShowXp(false)
    }
  }

  const handleXpComplete = () => {
    setShowXp(false)
  }

  return (
    <div className="w-full max-w-[90vw] sm:max-w-[80vw] mx-auto py-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-primary">Grammar Helper</h2>
        <p className="text-muted-foreground">{concept.description}</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 relative">
        <XpAnimation 
          amount={currentPhase.points} 
          show={showXp}
          onStart={undefined}
          onComplete={handleXpComplete}
        />
        
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex justify-center mb-4">
            <div className="flex space-x-2">
              {concept.phases.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index < currentPhaseIndex 
                      ? 'bg-green-500' 
                      : index === currentPhaseIndex 
                        ? 'bg-primary' 
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Phase title */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg sm:text-xl font-semibold">
                Phase {currentPhaseIndex + 1}: Transform "{currentPhase.baseWord}"
              </h3>
            </div>
            <p className="text-muted-foreground text-sm">
              {currentPhase.explanation}
            </p>
          </div>

          {/* Word transformation area */}
          <div className="flex items-center justify-center gap-4 py-6">
            {/* Base word */}
            <motion.div 
              className="text-center"
              initial={false}
              animate={showTransformation ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-gray-100 rounded-lg p-4 min-w-[140px]">
                <div className="text-2xl font-bold text-gray-800 mb-2">
                  {currentPhase.baseWord}
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  "{currentPhase.baseDefinition}"
                </div>
                <div className="text-xs text-gray-500 italic border-t pt-2">
                  Example: {currentPhase.exampleBefore}
                </div>
              </div>
            </motion.div>

            {/* Transform button/arrow */}
            <div className="flex flex-col items-center">
              {!showTransformation ? (
                <Button
                  onClick={handleTransform}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-semibold transition-all hover:scale-105"
                >
                  Add {suffix}
                </Button>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-500"
                >
                  <ArrowRight className="h-8 w-8" />
                </motion.div>
              )}
            </div>

            {/* Transformed word */}
            <div className="text-center">
              <AnimatePresence>
                {showTransformation ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 border-2 border-green-200 rounded-lg p-4 min-w-[140px]"
                  >
                    <div className="text-2xl font-bold text-green-700 mb-2">
                      {currentPhase.transformedWord}
                    </div>
                    <div className="text-sm text-green-600 mb-3">
                      "{currentPhase.transformedDefinition}"
                    </div>
                    <div className="text-xs text-green-600 italic border-t border-green-200 pt-2">
                      Example: {currentPhase.exampleAfter}
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 min-w-[140px] flex items-center justify-center">
                    <div className="text-gray-400 text-sm">
                      Click "Add {suffix}"
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showTransformation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center"
              >
                <p className="text-blue-800 font-medium">
                  ✨ Great! You transformed "{currentPhase.baseWord}" into "{currentPhase.transformedWord}"
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  {currentPhase.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Continue button */}
          <AnimatePresence>
            {phaseComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <Button
                  onClick={handleContinue}
                  className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105"
                >
                  {isLastPhase ? "Complete Grammar Lesson" : "Next Transformation"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 