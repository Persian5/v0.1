import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XpAnimation } from "./XpAnimation"
import { X } from "lucide-react"
import { playSuccessSound } from "./Flashcard"

interface WordItem {
  id: string;
  text: string;
  translation: string;
}

export interface FinalChallengeProps {
  // Data structure
  words: WordItem[];
  targetWords: string[];
  
  // Content configuration
  title?: string;
  description?: string;
  successMessage?: string;
  incorrectMessage?: string;
  
  // Gameplay
  points: number;
  onComplete: (success: boolean) => void;
  onXpStart?: () => void;
}

export function FinalChallenge({ 
  words,
  targetWords,
  title = "Final Challenge",
  description,
  successMessage = "Perfect! You got the order right!",
  incorrectMessage = "Almost there—let's try that order again!",
  points = 20, 
  onComplete,
  onXpStart
}: FinalChallengeProps) {
  // SYSTEMATIC RANDOMIZATION: Randomize word bank display order once on mount
  // Following same pattern as Quiz component for consistency
  const shuffledWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5);
  }, [words]);

  // Generate dynamic description if none provided
  const getDynamicDescription = () => {
    if (description) return description;
    
    // Show the English translations in the correct order so students know the target conversation flow
    const orderedTranslations = targetWords.map(targetId => {
      const word = shuffledWords.find(w => w.id === targetId);
      return word ? word.translation : '';
    }).filter(Boolean);
    
    if (orderedTranslations.length === 0) {
      return "Arrange these words to create a conversation.";
    }
    
    return `Build this conversation: ${orderedTranslations.join(' → ')}`;
  };

  // Initialize items from props instead of hardcoding
  const [items, setItems] = useState(() => 
    shuffledWords.map(word => ({
      id: word.id,
      text: word.text,
      translation: word.translation,
      order: null as number | null
    }))
  )
  
  // Initialize slots based on targetWords length
  const [slots, setSlots] = useState(() => 
    targetWords.map((_, index) => ({
      id: index + 1,
      itemId: null as string | null
    }))
  )
  
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const confettiCanvasRef = useRef<HTMLDivElement>(null)

  // Reset items and slots when props change
  useEffect(() => {
    setItems(shuffledWords.map(word => ({
      id: word.id,
      text: word.text,
      translation: word.translation,
      order: null as number | null
    })))
    
    setSlots(targetWords.map((_, index) => ({
      id: index + 1,
      itemId: null as string | null
    })))
    
    setShowFeedback(false)
    setIsCorrect(false)
  }, [shuffledWords, targetWords])

  // Handle clicking on a phrase to add it to the next available slot
  const handlePhraseClick = (itemId: string) => {
    // Find the first empty slot
    const firstEmptySlot = slots.find(slot => slot.itemId === null);
    if (!firstEmptySlot) return; // No empty slots
    
    // Update the slots state
    setSlots(slots.map(slot => {
      if (slot.id === firstEmptySlot.id) {
        return { ...slot, itemId }
      }
      return slot;
    }))

    // Update items state with their order
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, order: firstEmptySlot.id }
      }
      return item;
    }))
  }
  
  // Check if all slots are filled
  const allSlotsFilled = slots.every(slot => slot.itemId !== null)
  
  // Validate order
  const checkOrder = () => {
    // Get current order of items
    const currentOrder = slots.map(slot => {
      const item = items.find(item => item.id === slot.itemId)
      return item ? item.id : null
    })
    
    // Check if each filled slot matches the expected target word
    const filledSlotCount = currentOrder.filter(id => id !== null).length
    const correctCount = currentOrder.filter((id, index) => 
      index < targetWords.length && id === targetWords[index]
    ).length
    
    // All filled slots must match expected positions
    const isOrderCorrect = filledSlotCount === targetWords.length && correctCount === targetWords.length
    
    setShowFeedback(true)
    setIsCorrect(isOrderCorrect)
    
    if (isOrderCorrect) {
      // Play success sound for correct order
      playSuccessSound();
      
      // Award XP immediately when correct order is achieved
      if (onXpStart) {
        onXpStart();
      }
      
      // Trigger XP animation for visual feedback
      setShowXp(true)
      
      // Trigger confetti
      if (typeof window !== 'undefined') {
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
            gravity: 0.8,
          })
        })
      }
    } else {
      // Shake effect for incorrect order provided by the animate-shake class
      setTimeout(() => {
        setShowFeedback(false)
      }, 2000)
    }
  }

  // Get an item by slotId
  const getItemForSlot = (slotId: number) => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot || !slot.itemId) return null
    return items.find(item => item.id === slot.itemId)
  }
  
  // Remove item from a slot
  const removeFromSlot = (slotId: number) => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot || !slot.itemId) return

    const itemIdToRemove = slot.itemId;

    setSlots(slots.map(s => 
      s.id === slotId ? { ...s, itemId: null } : s
    ))
    
    setItems(items.map(item => 
      item.id === itemIdToRemove ? { ...item, order: null } : item
    ))
  }

  // Reset the challenge
  const resetChallenge = () => {
    setSlots(slots.map(slot => ({ ...slot, itemId: null })));
    setItems(items.map(item => ({ ...item, order: null })));
    setShowFeedback(false);
    setIsCorrect(false);
  }

  return (
    <div className="w-full py-2">
      <div ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-50"></div>
      
      <div className="text-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-primary">{title}</h2>
        <p className="text-muted-foreground text-sm sm:text-base mb-2">
          {getDynamicDescription()}
        </p>
      </div>

      <Card className="mb-4 w-full">
        <CardContent className="pt-4">
          <XpAnimation 
            amount={points} 
            show={showXp}
            onStart={undefined}
            onComplete={() => {
              // Just hide animation - don't call onComplete again
              setShowXp(false)  // reset for next use
              // Now call onComplete only after animation is done
              onComplete(true)
            }}
          />
          {/* Slots for ordering */}
          <div 
            className={`grid grid-cols-1 gap-3 mb-4 ${
              showFeedback && !isCorrect ? 'animate-shake' : ''
            }`}
          >
            {slots.map((slot) => {
              const item = getItemForSlot(slot.id)
              
              return (
                <div 
                  key={slot.id}
                  className={`
                    flex items-center p-3 rounded-lg border-2 border-dashed transition-all 
                    ${item ? 'border-primary bg-primary/5' : 'border-gray-300'}
                    ${showFeedback && isCorrect ? 'border-green-500 bg-green-50' : ''}
                    ${showFeedback && !isCorrect ? 'border-red-500 bg-red-50' : ''}
                  `}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                    <span className="text-primary font-semibold text-sm">{slot.id}</span>
                  </div>
                  
                  {item ? (
                    <div className="flex justify-between items-center flex-1">
                      <span className="text-base">{item.text}</span>
                      <button 
                        className="text-gray-400 hover:text-red-500 flex items-center ml-2"
                        onClick={() => removeFromSlot(slot.id)}
                        disabled={showFeedback && isCorrect}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-400 italic text-sm">Click a phrase below</div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Clickable phrases */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {items.filter(item => item.order === null).map((item) => (
              <button
                key={item.id}
                onClick={() => handlePhraseClick(item.id)}
                disabled={showFeedback && isCorrect}
                className="
                  px-3 py-1.5 bg-accent text-white rounded-lg
                  shadow-sm hover:shadow-md active:scale-95 transition-all text-sm sm:text-base
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {item.text}
              </button>
            ))}
          </div>
          
          {/* Submit button */}
          <div className="text-center mt-3">
            {showFeedback && !isCorrect ? (
              <Button
                className="px-4 py-2 rounded-lg font-semibold transition-all w-full sm:w-auto text-base"
                onClick={resetChallenge}
              >
                Retry
              </Button>
            ) : (
              <Button
                className={`
                  px-4 py-2 rounded-lg font-semibold transition-all w-full sm:w-auto text-base
                  ${allSlotsFilled 
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
                disabled={!allSlotsFilled || (showFeedback && isCorrect)}
                onClick={checkOrder}
              >
                Check My Answer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Feedback */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`text-center p-3 rounded-lg text-sm ${
              isCorrect 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
          >
            {isCorrect ? (
              <div>
                <div className="font-bold text-base sm:text-lg mb-1">
                  {successMessage}
                </div>
                <div className="text-base">
                  +{points} XP!
                </div>
              </div>
            ) : (
              <div>
                <div className="font-bold">{incorrectMessage}</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 