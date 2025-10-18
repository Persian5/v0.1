import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XpAnimation } from "./XpAnimation"
import { X } from "lucide-react"
import { playSuccessSound } from "./Flashcard"
import { useAuth } from "@/components/auth/AuthProvider"
import { StoryProgressService } from "@/lib/services/story-progress-service"

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
  
  // Conversation flow for realistic Persian patterns
  conversationFlow?: {
    description: string;           // "A polite introduction conversation"
    expectedPhrase: string;        // "Hello, what is your name, goodbye, thank you"
    persianSequence: string[];     // ["salam", "esme", "shoma", "chiye", "khodafez", "merci"]
  };
  
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
  conversationFlow,
  points = 20, 
  onComplete,
  onXpStart
}: FinalChallengeProps) {
  // Get user name for personalization
  const { user } = useAuth()
  const authFirstName = user?.user_metadata?.first_name || ''
  const userName = StoryProgressService.getUserName()
  const displayName = userName !== 'Friend' ? userName : authFirstName || 'Friend'
  
  // Function to personalize text with user's name
  const personalizeText = (text: string): string => {
    return text.replace(/{name}/g, displayName)
  }

  // ENHANCED WORD BANK: Handle conversation flow patterns
  const enhancedWords = useMemo(() => {
    if (!conversationFlow) {
      return words; // Use original words if no conversation flow
    }
    
    // Create enhanced word bank with conversation-aware vocabulary
    const conversationWords: WordItem[] = [];
    const usedWordIds = new Set<string>();
    
    // Add words needed for the conversation sequence
    conversationFlow.persianSequence.forEach(seqId => {
      const originalWord = words.find(w => w.id === seqId);
      if (originalWord && !usedWordIds.has(seqId)) {
        conversationWords.push(originalWord);
        usedWordIds.add(seqId);
      }
    });
    
    // Only add user's name if it's actually needed in the target sequence
    // This prevents unwanted personalization in lessons that don't require it
    if (displayName && displayName !== 'Friend' && targetWords.includes("user-name")) {
      const nameWord: WordItem = {
        id: "user-name",
        text: `${displayName}-e`,
        translation: displayName
      };
      conversationWords.push(nameWord);
      usedWordIds.add("user-name");
    }
    
    // Add remaining words as distractors (avoiding duplicates)
    words.forEach(word => {
      if (!usedWordIds.has(word.id)) {
        conversationWords.push(word);
        usedWordIds.add(word.id);
      }
    });
    
    return conversationWords;
  }, [words, conversationFlow, displayName, targetWords]);

  // SYSTEMATIC RANDOMIZATION: Randomize word bank display order once on mount
  // Following same pattern as Quiz component for consistency
  const shuffledWords = useMemo(() => {
    return [...enhancedWords].sort(() => Math.random() - 0.5);
  }, [enhancedWords]);

  // Generate dynamic description if none provided
  const getDynamicDescription = () => {
    if (description) return personalizeText(description);
    
    if (conversationFlow) {
      return `${conversationFlow.description}: "${personalizeText(conversationFlow.expectedPhrase)}"`;
    }
    
    // Show the English translations in the correct order so students know the target conversation flow
    const orderedTranslations = targetWords.map(targetId => {
      const word = shuffledWords.find(w => w.id === targetId);
      return word ? word.translation : '';
    }).filter(Boolean);
    
    if (orderedTranslations.length === 0) {
      return "Arrange these words to create a sentence.";
    }
    
    return `Build this sentence: ${orderedTranslations.join(' ')}`;
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
  
  // Initialize slots based on conversation flow or targetWords length
  const [slots, setSlots] = useState(() => {
    const sequenceLength = conversationFlow ? conversationFlow.persianSequence.length : targetWords.length;
    return Array.from({ length: sequenceLength }, (_, index) => ({
      id: index + 1,
      itemId: null as string | null
    }));
  });
  
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
    
    // Only reset slots when the expected sequence length changes
    const sequenceLength = conversationFlow ? conversationFlow.persianSequence.length : targetWords.length;
    setSlots(Array.from({ length: sequenceLength }, (_, index) => ({
      id: index + 1,
      itemId: null as string | null
    })));
    
    setShowFeedback(false)
    setIsCorrect(false)
  }, [shuffledWords, targetWords, conversationFlow])

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
    
    let isOrderCorrect = false;
    
    if (conversationFlow) {
      // Use conversation flow validation for realistic Persian patterns
      const filledSlotCount = currentOrder.filter(id => id !== null).length;
      const expectedSequence = conversationFlow.persianSequence;
      
      // Check if sequence matches conversation flow (allowing duplicates to be interchangeable)
      const correctCount = currentOrder.filter((id, index) => {
        if (index >= expectedSequence.length || id === null) return false;
        
        const expectedId = expectedSequence[index];
        const currentItem = items.find(item => item.id === id);
        const expectedItem = words.find(word => word.id === expectedId);
        
        // Allow exact ID match OR same text content (for duplicates like man/man2, az/az2)
        return id === expectedId || 
               (currentItem && expectedItem && currentItem.text === expectedItem.text);
      }).length;
      
      isOrderCorrect = filledSlotCount === expectedSequence.length && correctCount === expectedSequence.length;
    } else {
      // Default behavior: match target words order
      const filledSlotCount = currentOrder.filter(id => id !== null).length;
      const correctCount = currentOrder.filter((id, index) => {
        if (index >= targetWords.length || id === null) return false;
        
        const expectedId = targetWords[index];
        const currentItem = items.find(item => item.id === id);
        const expectedItem = words.find(word => word.id === expectedId);
        
        // Allow exact ID match OR same text content (for duplicates like man/man2, az/az2)
        return id === expectedId || 
               (currentItem && expectedItem && currentItem.text === expectedItem.text);
      }).length;
    
    // All filled slots must match expected positions
      isOrderCorrect = filledSlotCount === targetWords.length && correctCount === targetWords.length;
    }
    
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
    <div className="w-full pt-1 pb-0 -mt-4 sm:-mt-6">
      <div ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-50"></div>
      
      <div className="text-center mb-3 sm:mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-primary">{title}</h2>
        <p className="text-muted-foreground text-sm sm:text-base mb-2">
          {getDynamicDescription()}
        </p>
        {conversationFlow && (
          <p className="text-xs text-blue-600 italic mb-2">
            Build this conversation in Persian word order
          </p>
        )}
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
          {/* 2-column grid left→right; last odd slot spans both columns */}
          <div
            className={`grid grid-cols-2 gap-3 mb-4 grid-flow-row dense ${
              showFeedback && !isCorrect ? 'animate-shake' : ''
            }`}
          >
            {slots.map((slot, idx) => {
              const item = getItemForSlot(slot.id)
              
              return (
                <div 
                  key={slot.id}
                  className={`
                      relative flex items-center justify-center h-10 sm:h-11 rounded-lg border-2 border-dashed transition-all
                      ${item ? 'border-primary bg-primary/5' : 'border-gray-300'}
                      ${showFeedback && isCorrect ? 'border-green-500 bg-green-50' : ''}
                      ${showFeedback && !isCorrect ? 'border-red-500 bg-red-50' : ''}
                      ${idx === slots.length - 1 && slots.length % 2 === 1 ? 'col-span-2' : ''}
                      p-2 md:p-2.5
                    `}
                 >
                   {/* Badge on left edge */}
                   <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">{slot.id}</span>
                   </div>
                  
                  {item ? (
                    <div className="flex-1 min-w-0 text-center">
                      {/* Ensure long words wrap inside the slot without overflow */}
                      <span className="text-sm sm:text-base truncate">
                        {item.text}
                      </span>
                      {/* Remove button on right edge */}
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                        onClick={() => removeFromSlot(slot.id)}
                        disabled={showFeedback && isCorrect}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full text-center text-gray-400 italic text-xs sm:text-sm truncate pl-8 pr-8 sm:pl-0 sm:pr-0">Click a phrase below</div>
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
      
      {/* Feedback popup removed – XP animation handles success; shake effect shows incorrect */}
    </div>
  )
} 