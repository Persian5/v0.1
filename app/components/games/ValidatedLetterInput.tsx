"use client"

import { useRef } from 'react'
import { motion } from 'framer-motion'

interface ValidatedLetterInputProps {
  value: string
  targetAnswer: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  disabled: boolean
  className?: string
}

export function ValidatedLetterInput({
  value,
  targetAnswer,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  className
}: ValidatedLetterInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Normalize answers for comparison (handle multiple valid formats)
  const normalizeAnswer = (text: string): string => {
    return text.toLowerCase().trim().replace(/[^a-z]/g, '') // Remove spaces, hyphens, etc.
  }

  const normalizedTarget = normalizeAnswer(targetAnswer)
  const normalizedInput = normalizeAnswer(value)

  // Validate each character
  const validateCharacter = (char: string, index: number): 'correct' | 'incorrect' | 'pending' => {
    if (index >= normalizedInput.length) return 'pending'
    if (index >= normalizedTarget.length) return 'incorrect'
    return normalizedInput[index] === normalizedTarget[index] ? 'correct' : 'incorrect'
  }

  // Handle input changes with max length enforcement
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // Prevent typing more than target length - strict limit
    if (normalizeAnswer(newValue).length > normalizedTarget.length) {
      return // Don't update if exceeds target length
    }
    onChange(newValue)
  }

  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Hidden input for actual text entry */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="absolute inset-0 opacity-0 w-full h-full z-10 cursor-text"
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      
      {/* Visual letter display */}
      <div 
        className="w-full px-4 py-4 text-base sm:text-lg bg-white rounded-xl shadow-sm border-2 border-primary/20 focus-within:border-primary focus-within:shadow-md transition-all min-h-[56px] flex items-center cursor-text hover:border-primary/40"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-1.5 w-full justify-center">
          {/* Show target letters with validation colors */}
          {normalizedTarget.split('').map((targetChar, index) => {
            const status = validateCharacter(targetChar, index)
            const userChar = index < normalizedInput.length ? normalizedInput[index] : ''
            
            return (
              <span
                key={index}
                className={`
                  inline-flex items-center justify-center min-w-[28px] h-[36px] rounded-lg text-base font-semibold transition-all duration-200
                  ${status === 'correct' 
                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                    : status === 'incorrect'
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-gray-50 text-gray-400 border-2 border-gray-200'
                  }
                `}
              >
                {status === 'pending' ? (
                  <span className="text-gray-300 font-normal">_</span>
                ) : (
                  userChar.toUpperCase()
                )}
              </span>
            )
          })}
          
          {/* Show extra characters (beyond target length) in red */}
          {normalizedInput.length > normalizedTarget.length && (
            normalizedInput.slice(normalizedTarget.length).split('').map((char, index) => (
              <span
                key={`extra-${index}`}
                className="inline-flex items-center justify-center min-w-[28px] h-[36px] rounded-lg text-base font-semibold bg-red-100 text-red-700 border-2 border-red-300"
              >
                {char.toUpperCase()}
              </span>
            ))
          )}
          
          {/* Typing cursor */}
          {!disabled && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center justify-center w-[3px] h-[36px] bg-primary rounded-full ml-0.5"
            />
          )}
        </div>
      </div>
      
      {/* Progress indicator - more subtle */}
      <div className="mt-2 flex items-center justify-center gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: normalizedTarget.length }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i < normalizedInput.length 
                  ? validateCharacter('', i) === 'correct'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {Math.min(normalizedInput.length, normalizedTarget.length)}/{normalizedTarget.length}
        </span>
      </div>
    </div>
  )
}

