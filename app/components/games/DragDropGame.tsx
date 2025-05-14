import { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { XpAnimation } from "./XpAnimation"
import { motion, AnimatePresence } from "framer-motion"
import { playSuccessSound } from "./Flashcard"

interface DragDropGameProps {
  words: { id: string; text: string; slotId: string }[]  // two draggable words
  slots:  { id: string; text: string }[]                // four drop targets
  points: number
  onXpStart?: () => void
  onComplete: (allCorrect: boolean) => void
}

export function DragDropGame({ 
  words,
  slots,
  points,
  onXpStart,
  onComplete,
}: DragDropGameProps) {
  const [matches, setMatches] = useState<Record<string,string>>({})  // slotId→wordId
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)
  const [showXp, setShowXp] = useState(false)
  const [showFeedback, setShowFeedback] = useState<{ 
    slotId: string; 
    wordId: string;
    correct: boolean 
  } | null>(null)

  // Reset feedback after 1.5s for incorrect attempts
  useEffect(() => {
    if (showFeedback && !showFeedback.correct) {
      const timer = setTimeout(() => {
        setShowFeedback(null);
        setSelectedWordId(null); // Clear selection when feedback disappears
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [showFeedback]);

  // Handle word selection
  const handleWordClick = (wordId: string) => {
    // If this word is already matched, do nothing
    if (Object.values(matches).includes(wordId)) return;
    
    // If we have a feedback showing, don't allow new selection
    if (showFeedback) return;
    
    setSelectedWordId(wordId);
  };

  // Handle slot selection
  const handleSlotClick = (slotId: string) => {
    // If no word selected, do nothing
    if (!selectedWordId) return;
    
    // If we have a feedback showing, don't allow new matches
    if (showFeedback) return;
    
    // Find the word object for the selected ID
    const selectedWord = words.find(w => w.id === selectedWordId);
    if (!selectedWord) return;
    
    // Check if this is the correct slot for the selected word
    const correct = selectedWord.slotId === slotId;
    
    if (correct) {
      // Track next match count
      const nextCount = Object.keys(matches).length + 1;
      // Add to matches (no sound per-match)
      setMatches(prev => ({ ...prev, [slotId]: selectedWordId }));
      // Clear selection
      setSelectedWordId(null);
      // If this was the final match, award XP and advance
      if (nextCount === words.length) {
        playSuccessSound();
        setShowXp(true);
        setTimeout(() => {
          onComplete(true);
          setShowXp(false);
        }, 800);
      }
    } else {
      // Show error feedback
      setShowFeedback({ 
        slotId, 
        wordId: selectedWordId,
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
    <div className="w-full px-2 sm:px-4 md:px-6 mx-auto">
      <div className="text-center mb-3 sm:mb-5">
        <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-primary">Match the Words</h2>
        <p className="text-sm xs:text-base text-muted-foreground">
          Click a Persian word, then click its English meaning to match.
        </p>
      </div>
      
      <div className="relative flex-grow flex flex-col touch-manipulation overflow-visible p-4 sm:p-6">
        <XpAnimation 
          amount={points} 
          show={showXp}
          onStart={onXpStart}
          onComplete={() => {
            // Just hide animation - don't call onComplete again
            setShowXp(false);
          }}
        />
        
        <div className="w-full">
          {/* Section header for Persian words */}
          <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-primary">Persian Words</h3>
          
          {/* Persian words - side by side */}
          <div className="flex flex-row justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            {words.map(w => {
              const isMatched = isWordMatched(w.id);
              const isIncorrect = showFeedback && !showFeedback.correct && showFeedback.wordId === w.id;
              
              return (
                <div key={w.id} className="flex-1">
                  <motion.div
                    className={`p-3 sm:p-4 md:p-6 rounded-lg border-2 select-none touch-action-none ${
                      isMatched
                        ? "border-green-500 bg-green-100" // Matched state - green border with light green fill
                        : isIncorrect
                          ? "border-red-500 bg-red-100" // Incorrect selection - red border with light red fill
                          : selectedWordId === w.id 
                            ? "border-primary bg-green-100" // Selected state - light green fill
                            : "border-primary/20 bg-primary/5" // Default state - very light primary bg
                    } shadow-md ${isMatched || isIncorrect ? "cursor-default" : "cursor-pointer"} h-full flex items-center justify-center min-h-[80px] sm:min-h-[100px] md:min-h-[120px] transition-all hover:scale-[1.02] active:scale-[0.98]`}
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {slots.map(slot => {
              const matchedWordId = matches[slot.id];
              const matchedWord = matchedWordId ? words.find(w => w.id === matchedWordId) : null;
              const isCorrect = matchedWord ? matchedWord.slotId === slot.id : false;
              const isMatched = isSlotMatched(slot.id);
              const isIncorrect = showFeedback && !showFeedback.correct && showFeedback.slotId === slot.id;
              
              return (
                <motion.div
                  key={slot.id}
                  onClick={() => {
                    if (!isMatched && !showFeedback) handleSlotClick(slot.id);
                  }}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all select-none touch-action-none ${
                    isMatched && isCorrect
                      ? 'border-green-500 bg-green-100' // Matched state - green border with light green fill
                      : isIncorrect
                        ? 'border-red-500 bg-red-100' // Incorrect state - red border with light red fill
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50' // Default with light gray bg
                  } ${!isMatched && !isIncorrect ? 'cursor-pointer' : 'cursor-default'} min-h-[70px] sm:min-h-[90px] md:min-h-[100px] shadow-md flex items-center justify-center hover:scale-[1.02] active:scale-[0.98]`}
                  animate={
                    isIncorrect
                      ? { x: [0, -10, 10, -10, 10, 0] }
                      : {}
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