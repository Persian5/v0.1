import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XpAnimation } from "./XpAnimation"
import { X } from "lucide-react"
import { playSuccessSound } from "./Flashcard"
import { FLAGS } from "@/lib/flags"
import { type LearnedSoFar } from "@/lib/utils/curriculum-lexicon"
import { type VocabularyItem } from "@/lib/types"

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
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed;
  learnedSoFar?: LearnedSoFar; // PHASE 4A: Learned vocabulary state for filtering word bank
  vocabularyBank?: VocabularyItem[]; // PHASE 4A: Vocabulary bank for ID lookup
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
  onXpStart,
  learnedSoFar, // PHASE 4A: Learned vocabulary state
  vocabularyBank // PHASE 4A: Vocabulary bank for lookup
}: FinalChallengeProps) {
  // PHASE 4A: Stable signatures for useMemo dependencies (prevents infinite re-renders)
  const learnedSignature = learnedSoFar
    ? learnedSoFar.vocabIds.join(",")
    : "";
  const vocabBankSignature = vocabularyBank
    ? vocabularyBank.map(v => v.id).join(",")
    : "";
  const wordsSignature = words.map(w => `${w.id}:${w.text}`).join(",");
  const targetWordsSignature = targetWords.join(",");
  const conversationFlowSignature = conversationFlow
    ? `${conversationFlow.persianSequence.join(",")}:${conversationFlow.expectedPhrase}`
    : "";

  // PHASE 4A: Learned-aware word bank filtering OR old behavior (flag-gated)
  const enhancedWords = useMemo(() => {
    // PHASE 4A: Filter words by learnedState when flag is ON
    let filteredWords = words;
    
    if (FLAGS.USE_LEARNED_VOCAB_IN_FINAL_CHALLENGE && learnedSoFar && learnedSoFar.vocabIds.length > 0 && vocabularyBank && vocabularyBank.length > 0) {
      // Step 1: Map word IDs to vocabulary IDs
      // FinalChallenge words have `id` field (e.g., "salam", "chetori")
      // These should match vocabulary IDs in the curriculum
      
      // Filter words to only include those that are in learnedSoFar
      const learnedWordIds = new Set(learnedSoFar.vocabIds);
      
      filteredWords = words.filter(word => {
        // Direct ID match (word.id === vocab.id)
        if (learnedWordIds.has(word.id)) {
          return true;
        }
        
        // Fallback: Try to match by text (Finglish) if ID doesn't match
        // This handles cases where word.id might be different from vocab.id
        const matchingVocab = vocabularyBank.find(v => {
          // Normalize for comparison (lowercase, remove hyphens/spaces)
          const normalizedWordText = word.text.toLowerCase().replace(/[- ]/g, '');
          const normalizedVocabFinglish = (v.finglish || '').toLowerCase().replace(/[- ]/g, '');
          return normalizedWordText === normalizedVocabFinglish;
        });
        
        if (matchingVocab && learnedWordIds.has(matchingVocab.id)) {
          return true;
        }
        
        // Always include target words (required for the challenge)
        // Even if not yet "learned", they must be available
        if (targetWords.includes(word.id)) {
          return true;
        }
        
        // Always include conversation flow sequence words (required)
        if (conversationFlow && conversationFlow.persianSequence.includes(word.id)) {
          return true;
        }
        
        return false;
      });
      
      // Safety check: Ensure we have enough words for the challenge
      const requiredWordIds = new Set([
        ...targetWords,
        ...(conversationFlow ? conversationFlow.persianSequence : [])
      ]);
      
      const hasAllRequired = requiredWordIds.size > 0 && 
        Array.from(requiredWordIds).every(id => filteredWords.some(w => w.id === id));
      
      if (!hasAllRequired) {
        console.warn('[FINAL CHALLENGE] Filtered word bank missing required words, falling back to full word bank');
        filteredWords = words; // Fallback to original
      }
      
      // PHASE 4A: Debug logging
      if (FLAGS.LOG_WORDBANK) {
        console.log(
          "%c[FINAL CHALLENGE - LEARNED FILTER]",
          "color: #E91E63; font-weight: bold;",
          {
            stepType: 'final',
            originalWordCount: words.length,
            filteredWordCount: filteredWords.length,
            learnedVocabCount: learnedSoFar.vocabIds.length,
            targetWordsCount: targetWords.length,
            conversationSequenceLength: conversationFlow?.persianSequence.length || 0,
            usingLearnedFilter: true,
            filteredWordIds: filteredWords.map(w => w.id),
          }
        );
      }
    } else {
      // OLD BEHAVIOR: Flag OFF or learnedSoFar missing
      filteredWords = words;
    }
    
    // ENHANCED WORD BANK: Handle conversation flow patterns (existing logic)
    if (!conversationFlow) {
      return filteredWords; // Use filtered words if no conversation flow
    }
    
    // Create enhanced word bank with conversation-aware vocabulary
    const conversationWords: WordItem[] = [];
    const usedWordIds = new Set<string>();
    
    // Add words needed for the conversation sequence
    conversationFlow.persianSequence.forEach(seqId => {
      const originalWord = filteredWords.find(w => w.id === seqId);
      if (originalWord && !usedWordIds.has(seqId)) {
        conversationWords.push(originalWord);
        usedWordIds.add(seqId);
      }
    });
    
    // Add remaining words as distractors (avoiding duplicates)
    filteredWords.forEach(word => {
      if (!usedWordIds.has(word.id)) {
        conversationWords.push(word);
        usedWordIds.add(word.id);
      }
    });
    
    return conversationWords;
  }, [
    wordsSignature,
    targetWordsSignature,
    conversationFlowSignature,
    learnedSignature,
    vocabBankSignature,
    FLAGS.USE_LEARNED_VOCAB_IN_FINAL_CHALLENGE
  ]); // Stable signatures prevent infinite re-renders

  // SYSTEMATIC RANDOMIZATION: Randomize word bank display order once on mount
  // Following same pattern as Quiz component for consistency
  const shuffledWords = useMemo(() => {
    return [...enhancedWords].sort(() => Math.random() - 0.5);
  }, [enhancedWords]);

  // Generate dynamic description if none provided
  const getDynamicDescription = () => {
    if (description) return description;
    
    if (conversationFlow) {
      // PHASE 8 FIX: Show English translation, not Persian (don't give answer away)
      const englishTranslation = words.map(w => w.translation).join(' ');
      return `Build this sentence: "${englishTranslation}"`;
    }
    
    // For final challenges without conversationFlow, we need to create proper sentences
    // This is a fallback for older final challenges that don't have conversationFlow defined
    const orderedTranslations = targetWords.map(targetId => {
      const word = shuffledWords.find(w => w.id === targetId);
      return word ? word.translation : '';
    }).filter(Boolean);
    
    if (orderedTranslations.length === 0) {
      return "Arrange these words to create a sentence.";
    }
    
    // Create a proper sentence instead of just joining words
    let sentence = orderedTranslations.join(' ');
    
    // Basic sentence formatting - capitalize first letter and add period if missing
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    if (!sentence.endsWith('.') && !sentence.endsWith('?') && !sentence.endsWith('!')) {
      sentence += '.';
    }
    
    return `Build this sentence: "${sentence}"`;
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
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)
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
  const checkOrder = async () => {
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
      
      // Award XP and check if step was already completed
      if (onXpStart) {
        const wasGranted = await onXpStart(); // Await the Promise to get result
        setIsAlreadyCompleted(!wasGranted); // If not granted, it was already completed
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
    <div className="w-full h-full flex flex-col">
      {/* Confetti Canvas */}
      <div ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-50"></div>
      
      {/* XP Animation - self-positioning */}
      <XpAnimation 
        amount={points} 
        show={showXp}
        isAlreadyCompleted={isAlreadyCompleted}
        onStart={undefined}
        onComplete={() => {
          setShowXp(false)
          onComplete(true)
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 overflow-y-auto">
        <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl flex flex-col">
          {/* Header */}
      <div className="text-center mb-3 sm:mb-4">
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-1 text-primary">
              FINAL CHALLENGE
            </h2>
            <p className="text-sm xs:text-base text-muted-foreground mb-2">
          {getDynamicDescription()}
        </p>
        {conversationFlow && (
          <p className="text-xs text-blue-600 italic mb-2">
            Build this conversation in Persian word order
          </p>
        )}
      </div>

          {/* Slots Grid */}
          <div
            className={`grid grid-cols-2 gap-2 sm:gap-3 mb-3 grid-flow-row dense ${
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
                    ${item ? 'border-primary bg-primary/5' : 'border-gray-300 bg-[#F8FAF8]'}
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
                    <div className="w-full text-center text-gray-400 italic text-xs sm:text-sm truncate pl-8 pr-8">
                      Click a phrase below
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Word Bank */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold mb-2 text-center">Word Bank:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
            {items.filter(item => item.order === null).map((item) => (
              <button
                key={item.id}
                onClick={() => handlePhraseClick(item.id)}
                disabled={showFeedback && isCorrect}
                className="
                    px-3 py-2 rounded-lg border-2 transition-all shadow-sm
                    border-primary/30 bg-white hover:border-green-400 hover:bg-green-50 hover:shadow-md active:scale-95 cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium
                "
              >
                {item.text}
              </button>
            ))}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Click words to add them to the slots above
            </p>
          </div>
          
          {/* Submit Button */}
          <div className="w-full mt-2">
            {showFeedback && !isCorrect ? (
              <Button
                className="gap-2 w-full"
                size="lg"
                onClick={resetChallenge}
              >
                Retry
              </Button>
            ) : (
              <Button
                className={`gap-2 w-full ${
                  !allSlotsFilled || (showFeedback && isCorrect)
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : ''
                }`}
                size="lg"
                disabled={!allSlotsFilled || (showFeedback && isCorrect)}
                onClick={checkOrder}
              >
                Check My Answer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 