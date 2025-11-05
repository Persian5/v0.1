import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "../../../components/ui/button"
import { XpAnimation } from "./XpAnimation"
import { motion, AnimatePresence } from "framer-motion"
import { playSuccessSound } from "./Flashcard"
import { VocabularyItem } from "@/lib/types"
import { WordBankService } from "@/lib/services/word-bank-service"
import { shuffle } from "@/lib/utils"

interface MatchingGameProps {
  words: { id: string; text: string; slotId: string }[]  // words to match
  slots:  { id: string; text: string }[]                // match targets
  points: number
  vocabularyBank?: VocabularyItem[] // Optional: for vocabulary tracking
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed
  onComplete: (allCorrect: boolean) => void
  onVocabTrack?: (vocabularyId: string, wordText: string, isCorrect: boolean, timeSpentMs?: number) => void // Track vocabulary performance
  preShuffled?: boolean // If true, skip internal shuffle (arrays already shuffled by parent)
}

export function MatchingGame({ 
  words,
  slots,
  points,
  vocabularyBank = [],
  onXpStart,
  onComplete,
  onVocabTrack,
  preShuffled = false
}: MatchingGameProps) {
  // SYSTEMATIC RANDOMIZATION: Randomize both words and slots display order once on mount
  // Following same pattern as Quiz component for consistency
  // If preShuffled=true, use arrays as-is (parent already shuffled them)
  // Use ref to track if we've already processed arrays (prevents re-shuffle on re-render)
  const processedWordsRef = useRef<Array<{ id: string; text: string; slotId: string }> | null>(null)
  const processedSlotsRef = useRef<Array<{ id: string; text: string }> | null>(null)
  const lastRoundKeyRef = useRef<string>('') // Track round to detect round changes
  
  // Create a stable key from words array to detect when it's a new round
  const wordsKey = useMemo(() => {
    return words.map(w => w.id).join(',')
  }, [words])
  
  const shuffledWords = useMemo(() => {
    // If preShuffled=true, always return arrays as-is (no shuffle, no recalculation)
    if (preShuffled) {
      // Only update ref if this is a new round (detected by wordsKey change)
      if (wordsKey !== lastRoundKeyRef.current) {
        processedWordsRef.current = words
        lastRoundKeyRef.current = wordsKey
      }
      // Always return cached ref to prevent any recalculation
      return processedWordsRef.current || words
    }
    // Normal shuffle for lesson games
    return shuffle(words)
  }, [words, preShuffled, wordsKey])

  const shuffledSlots = useMemo(() => {
    // If preShuffled=true, always return arrays as-is (no shuffle, no recalculation)
    if (preShuffled) {
      // Only update ref if this is a new round (detected by wordsKey change)
      if (wordsKey !== lastRoundKeyRef.current) {
        processedSlotsRef.current = slots
      }
      // Always return cached ref to prevent any recalculation
      return processedSlotsRef.current || slots
    }
    // Normal shuffle for lesson games
    return shuffle(slots)
  }, [slots, preShuffled, wordsKey])

  // Responsive height tweaks based on number of matching pairs
  const totalPairs = shuffledWords.length;
  const isLargeSet = totalPairs > 4; // More than 4 pairs requires tighter mobile layout

  // Height classes for word (Persian) cards
  const wordHeightClasses = `${
    isLargeSet ? 'min-h-[68px]' : 'min-h-[80px]'
  } ${
    isLargeSet ? 'sm:min-h-[100px] md:min-h-[120px]' : 'sm:min-h-[125px] md:min-h-[150px]'
  }`;

  // Height classes for slot (English) cards
  const slotHeightClasses = `${
    isLargeSet ? 'min-h-[60px]' : 'min-h-[70px]'
  } ${
    isLargeSet ? 'sm:min-h-[90px] md:min-h-[100px]' : 'sm:min-h-[112px] md:min-h-[125px]'
  }`;

  const [matches, setMatches] = useState<Record<string,string>>({})  // slotId→wordId
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null) // NEW: track selected slot
  const [showXp, setShowXp] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)
  const [completionTimeout, setCompletionTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showFeedback, setShowFeedback] = useState<{ 
    slotId: string; 
    wordId: string;
    correct: boolean 
  } | null>(null)
  const [startTime] = useState(Date.now()) // Track start time for per-match tracking
  const [trackedMatches, setTrackedMatches] = useState<Set<string>>(new Set()) // Track which pairs have been tracked
  const [matchAttemptTimes, setMatchAttemptTimes] = useState<Record<string, number>>({}) // Track when each match was attempted

  /**
   * Find vocabulary ID for a matching pair
   * Matches by Finglish (word.text) or English (slot.text)
   */
  const findVocabularyId = (wordText: string, slotText: string): { vocabularyId: string; wordText: string } | null => {
    if (vocabularyBank.length === 0) return null;

    // Try to match by Finglish first (word.text)
    const byFinglish = vocabularyBank.find(v => 
      v.finglish.toLowerCase() === wordText.toLowerCase()
    );

    if (byFinglish) {
      return {
        vocabularyId: byFinglish.id,
        wordText: WordBankService.normalizeVocabEnglish(byFinglish.en)
      };
    }

    // Try to match by English (slot.text) - normalize both for comparison
    const normalizedSlotText = WordBankService.normalizeVocabEnglish(slotText).toLowerCase();
    const byEnglish = vocabularyBank.find(v => {
      const normalizedVocabEn = WordBankService.normalizeVocabEnglish(v.en).toLowerCase();
      return normalizedVocabEn === normalizedSlotText;
    });

    if (byEnglish) {
      return {
        vocabularyId: byEnglish.id,
        wordText: WordBankService.normalizeVocabEnglish(byEnglish.en)
      };
    }

    return null;
  }

  // Reset feedback after 600ms for incorrect attempts
  useEffect(() => {
    if (showFeedback && !showFeedback.correct) {
      const timer = setTimeout(() => {
        setShowFeedback(null);
        setSelectedWordId(null);
        setSelectedSlotId(null); // Clear both selections
      }, 600); // Reduced from 1500ms for snappier feedback
      
      return () => clearTimeout(timer);
    }
  }, [showFeedback]);

  // Clear selection when switching between word and slot
  const clearSelections = () => {
    setSelectedWordId(null);
    setSelectedSlotId(null);
  };

  // Handle word selection
  const handleWordClick = (wordId: string) => {
    // If this word is already matched, do nothing
    if (Object.values(matches).includes(wordId)) return;
    
    // If we have a feedback showing, don't allow new selection
    if (showFeedback) return;
    
    // If we have a slot selected, try to match them
    if (selectedSlotId) {
      tryMatch(wordId, selectedSlotId);
    } else {
      // Clear any previous selections and select this word
      clearSelections();
      setSelectedWordId(wordId);
    }
  };

  // Handle slot selection  
  const handleSlotClick = (slotId: string) => {
    // If this slot is already matched, do nothing
    if (isSlotMatched(slotId)) return;
    
    // If we have a feedback showing, don't allow new selection
    if (showFeedback) return;
    
    // If we have a word selected, try to match them
    if (selectedWordId) {
      tryMatch(selectedWordId, slotId);
    } else {
      // Clear any previous selections and select this slot
      clearSelections();
      setSelectedSlotId(slotId);
    }
  };

  // NEW: Unified matching logic with per-word tracking
  const tryMatch = async (wordId: string, slotId: string) => {
    // Find the word object for the selected ID
    const selectedWord = shuffledWords.find(w => w.id === wordId);
    if (!selectedWord) return;
    
    // Find the slot object
    const selectedSlot = shuffledSlots.find(s => s.id === slotId);
    if (!selectedSlot) return;
    
    // Check if this is the correct slot for the selected word
    const correct = selectedWord.slotId === slotId;
    
    // Track this match attempt immediately (correct or incorrect)
    const matchKey = `${wordId}-${slotId}`;
    if (onVocabTrack && !trackedMatches.has(matchKey)) {
      // Find vocabulary ID for this pair
      const vocabMatch = findVocabularyId(selectedWord.text, selectedSlot.text);
      
      if (vocabMatch) {
        // Record when this match attempt happened
        const attemptTime = Date.now();
        setMatchAttemptTimes(prev => ({ ...prev, [matchKey]: attemptTime }));
        
        // Calculate time spent: from game start to this attempt
        const timeSpentMs = attemptTime - startTime;
        
        onVocabTrack(
          vocabMatch.vocabularyId,
          vocabMatch.wordText,
          correct,
          timeSpentMs
        );
        // Mark this pair as tracked
        setTrackedMatches(prev => new Set(prev).add(matchKey));
      }
    }
    
    if (correct) {
      // Track next match count
      const nextCount = Object.keys(matches).length + 1;
      // Add to matches (no sound per-match)
      setMatches(prev => ({ ...prev, [slotId]: wordId }));
      // Clear selections
      clearSelections();
      // If this was the final match, award XP and advance
      if (nextCount === shuffledWords.length) {
        playSuccessSound();
        
        // Award XP and check if step was already completed
        if (onXpStart) {
          const wasGranted = await onXpStart(); // Await the Promise to get result
          setIsAlreadyCompleted(!wasGranted); // If not granted, it was already completed
        }
        
        // Trigger XP animation for visual feedback
        setShowXp(true);
        
        // FIX: Set up fallback timeout in case XpAnimation doesn't trigger onComplete
        // Clear any existing timeout first
        if (completionTimeout) {
          clearTimeout(completionTimeout);
        }
        
        const timeoutId = setTimeout(() => {
          // Fallback: If animation hasn't completed after 1.5s, manually advance
          setShowXp(false);
          onComplete(true);
        }, 1500);
        
        setCompletionTimeout(timeoutId);
      }
    } else {
      // Show error feedback
      setShowFeedback({ 
        slotId, 
        wordId,
        correct: false 
      });
    }
  };

  // Check if a word is matched with any slot
  const isWordMatched = (wordId: string) => {
    return Object.values(matches).includes(wordId);
  };

  // Check if a slot has a matched word
  const isSlotMatched = (slotId: string) => {
    return slotId in matches;
  };

  return (
    <div className="w-full px-1 py-2 sm:px-4 sm:py-4 md:px-6 md:pb-6 mx-auto">
      <div className="text-center mb-3 sm:mb-5">
        <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-primary">Match the Words</h2>
        <p className="text-sm xs:text-base text-muted-foreground">
          Click any word, then click its match to connect them.
        </p>
      </div>
      
      <div className="relative flex-grow flex flex-col touch-manipulation overflow-visible p-3 sm:p-6">
        <XpAnimation 
          amount={points} 
          show={showXp}
          isAlreadyCompleted={isAlreadyCompleted}
          onStart={undefined}
          onComplete={() => {
            // Animation completed - clear fallback timeout and advance
            if (completionTimeout) {
              clearTimeout(completionTimeout);
              setCompletionTimeout(null);
            }
            setShowXp(false);
            onComplete(true);
          }}
        />
        
        <div className="w-full">
          {/* Section header for Persian words */}
          <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-primary">Persian Words</h3>
          
          {/* Persian words - side by side */}
          <div className="flex flex-row flex-wrap sm:flex-nowrap justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            {shuffledWords.map(w => {
              const isMatched = isWordMatched(w.id);
              const isSelected = selectedWordId === w.id;
              const isIncorrect = showFeedback && !showFeedback.correct && showFeedback.wordId === w.id;
              
              return (
                <div key={w.id} className="flex-1 min-w-[45%] sm:min-w-0">
                  <motion.div
                    className={`p-3 sm:p-4 md:p-6 rounded-lg border-2 select-none touch-action-none ${
                      isMatched
                        ? "border-green-500 bg-green-100" // Matched state - green border with light green fill
                        : isIncorrect
                          ? "border-red-500 bg-red-100" // Incorrect selection - red border with light red fill
                          : isSelected 
                            ? "border-primary bg-blue-100" // Selected state - blue fill to distinguish from match
                            : "border-primary/20 bg-primary/5" // Default state - very light primary bg
                    } shadow-md ${isMatched || isIncorrect ? "cursor-default" : "cursor-pointer"} h-full flex items-center justify-center ${wordHeightClasses} transition-all sm:hover:scale-[1.02] active:scale-[0.98]`}
                    onClick={() => {
                      if (!isMatched && !isIncorrect) handleWordClick(w.id);
                    }}
                    animate={
                      isIncorrect
                        ? { x: [0, -10, 10, -10, 10, 0] }
                        : {}
                    }
                    transition={{ duration: 0.5 }}
                  >
                    <span className={`text-lg sm:text-xl md:text-2xl font-semibold text-center ${isIncorrect ? "text-red-600" : ""}`}>
                      {w.text}
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Section header for English meanings */}
          <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-primary">English Meanings</h3>
          
          {/* English word bank - below */}
          <div className="flex flex-row flex-wrap justify-center gap-3 sm:gap-4">
            {shuffledSlots.map(slot => {
              const matchedWordId = matches[slot.id];
              const matchedWord = matchedWordId ? shuffledWords.find(w => w.id === matchedWordId) : null;
              const isCorrect = matchedWord ? matchedWord.slotId === slot.id : false;
              const isMatched = isSlotMatched(slot.id);
              const isSelected = selectedSlotId === slot.id;
              const isIncorrect = showFeedback && !showFeedback.correct && showFeedback.slotId === slot.id;
              
              return (
                <motion.div
                  key={slot.id}
                  onClick={() => {
                    if (!isMatched && !showFeedback) handleSlotClick(slot.id);
                  }}
                  className={`flex-1 min-w-[45%] sm:min-w-0 p-3 sm:p-4 rounded-lg border-2 transition-all select-none touch-action-none ${
                    isMatched && isCorrect
                      ? 'border-green-500 bg-green-100'
                      : isIncorrect
                        ? 'border-red-500 bg-red-100'
                        : isSelected
                          ? 'border-primary bg-blue-100'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  } ${!isMatched && !isIncorrect ? 'cursor-pointer' : 'cursor-default'} ${slotHeightClasses} shadow-md flex items-center justify-center sm:hover:scale-[1.02] active:scale-[0.98]`}
                  animate={
                    isIncorrect ? { x: [0, -10, 10, -10, 10, 0] } : {}
                  }
                  transition={{ duration: 0.5 }}
                >
                  <p className={`text-center text-base sm:text-lg md:text-xl font-medium ${isIncorrect ? "text-red-600" : ""}`}>
                    {slot.text}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Feedback text */}
          <AnimatePresence>
            {showFeedback && !showFeedback.correct && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-red-500 mt-4 text-sm sm:text-base font-medium"
              >
                Almost! Try again.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 