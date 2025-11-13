"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"
import { XpAnimation } from "./XpAnimation"
import { playSuccessSound } from "./Flashcard"

export interface GrammarIntroProps {
  title: string
  description: string
  rule: string
  visualType: 'tree' | 'comparison' | 'flow'
  visualData: {
    base?: string
    transformations?: Array<{
      label: string
      result: string
      meaning: string
    }>
    before?: string
    after?: string
    steps?: string[]
  }
  points?: number
  onComplete: (correct: boolean) => void
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed
}

export function GrammarIntro({
  title,
  description,
  rule,
  visualType,
  visualData,
  points = 1,
  onComplete,
  onXpStart
}: GrammarIntroProps) {
  const [showXp, setShowXp] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [hasContinued, setHasContinued] = useState(false)

  const handleContinue = async () => {
    if (hasContinued) return
    
    setHasContinued(true)
    playSuccessSound()
    
    // Award XP
    if (onXpStart) {
      const wasGranted = await onXpStart()
      setIsAlreadyCompleted(!wasGranted)
    }
    
    setShowXp(true)
  }

  const handleXpComplete = () => {
    setShowXp(false)
    onComplete(true)
  }

  const renderVisual = () => {
    switch (visualType) {
      case 'tree':
        if (!visualData.base || !visualData.transformations) return null
        
        return (
          <div className="flex flex-col items-center space-y-6 py-8">
            {/* Base word */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-100 border-2 border-gray-300 rounded-xl p-6 shadow-md"
            >
              <div className="text-3xl font-bold text-gray-800 text-center">
                {visualData.base}
              </div>
            </motion.div>

            {/* Connector line */}
            <div className="flex justify-center">
              <div className="h-8 w-0.5 bg-gray-300"></div>
            </div>

            {/* Transformations */}
            <div className="flex justify-center gap-4 flex-wrap">
              {visualData.transformations.map((transformation, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 min-w-[150px] shadow-md">
                    <div className="text-xl font-bold text-green-700 text-center mb-1">
                      {transformation.result}
                    </div>
                    <div className="text-sm text-green-600 text-center">
                      {transformation.meaning}
                    </div>
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {visualData.base} + {transformation.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )

      case 'comparison':
        if (!visualData.before || !visualData.after) return null
        
        return (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-md"
            >
              <div className="text-xs text-red-600 mb-1 font-medium">Before</div>
              <div className="text-xl font-bold text-red-700 text-center">
                {visualData.before}
              </div>
            </motion.div>

            <div className="text-2xl font-bold text-primary">→</div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-green-50 border-2 border-green-200 rounded-xl p-4 shadow-md"
            >
              <div className="text-xs text-green-600 mb-1 font-medium">After</div>
              <div className="text-xl font-bold text-green-700 text-center">
                {visualData.after}
              </div>
            </motion.div>
          </div>
        )

      case 'flow':
        if (!visualData.steps) return null
        
        return (
          <div className="flex flex-col items-center space-y-4 py-8">
            {visualData.steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 w-full max-w-md shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="text-lg font-medium text-blue-800">
                    {step}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* XP Animation */}
      <XpAnimation
        amount={points}
        show={showXp}
        isAlreadyCompleted={isAlreadyCompleted}
        onComplete={handleXpComplete}
      />

      {/* Content - Fits viewport, no scrolling */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 max-w-4xl mx-auto w-full overflow-hidden">
        {/* Header - Compact */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-primary">
              GRAMMAR RULE
            </h2>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {title}
          </h1>
        </div>

        {/* Description - Compact, bullet points */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-primary/10 mb-3 w-full">
          <p className="text-sm text-gray-700 leading-relaxed text-center mb-3">
            {description}
          </p>
          <div className="bg-primary/5 rounded-lg p-3 border-l-4 border-primary">
            <p className="text-sm font-semibold text-primary text-center">
              {rule}
            </p>
          </div>
        </div>

        {/* Visual - Compact */}
        <div className="w-full mb-3 flex-1 flex items-center justify-center min-h-0">
          <div className="w-full h-full flex items-center justify-center">
            {renderVisual()}
          </div>
        </div>

        {/* Continue Button - Compact */}
        <Button
          onClick={handleContinue}
          disabled={hasContinued || showXp}
          className="w-full sm:w-auto min-w-[180px] text-base py-3 bg-primary hover:bg-primary/90"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

