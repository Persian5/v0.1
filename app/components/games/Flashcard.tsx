import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { XpAnimation } from "./XpAnimation"
import { AudioService } from "@/lib/services/audio-service"

// Reusable success sound player that can be exported and used by other components
export function playSuccessSound() {
  try {
    const successAudio = new Audio('/audio/successfinal.mp3');
    successAudio.play().catch(error => {
      console.error("Error playing success audio:", error);
    });
  } catch (error) {
    console.error("Error creating audio:", error);
  }
}

interface FlashcardProps {
  // Legacy format
  front?: string
  back?: string
  // New vocabulary-based format
  vocabularyItem?: {
    id: string;
    en: string;
    finglish: string;
    phonetic: string;
    audio?: string;
  }
  points?: number
  onContinue: () => void
  onXpStart?: () => void
  isFlipped?: boolean
  onFlip?: () => void
  showContinueButton?: boolean
}

// Helper function to convert card text to audio filename - DEPRECATED
// Keeping for legacy flashcard format support only
function getAudioFilename(text: string): string {
  // Remove emoji and trim whitespace
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .trim()
    .toLowerCase();
  
  // Map specific texts to their audio filenames
  const audioMap: Record<string, string> = {
    "hello": "hello.mp3",
    "salam": "salam.mp3",
    "how are you?": "howareyou.mp3",
    "chetori": "chetori.mp3",
    "goodbye": "goodbye.mp3",
    "khodafez": "khodafez.mp3",
    "welcome": "welcome.mp3",
    "khosh amadid": "khoshamadid.mp3"
  };
  
  return audioMap[cleanText] || "";
}

// Helper function to get pronunciation for legacy format - DEPRECATED
// Modern flashcards should use vocabularyItem.phonetic instead
function getPronunciation(text: string): string {
  // Clean text to remove emoji and leading/trailing space
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  
  // Map specific texts to their pronunciations
  const pronunciationMap: Record<string, string> = {
    "Salam": "sah-LUHM",
    "Khodafez": "kho-DUH-fez",
    "Chetori": "che-TOH-ree",
    "Khosh Amadid": "khosh uh-mah-DEED"
  };
  
  return pronunciationMap[cleanText] || "";
}

export function Flashcard({
  front,
  back,
  vocabularyItem,
  points = 2,
  onContinue,
  onXpStart,
  isFlipped: extFlipped,
  onFlip: extFlip,
  showContinueButton,
}: FlashcardProps) {
  const [localFlip, setLocalFlip] = useState(false)
  const [localShowNext, setLocalShowNext] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [lastFlipState, setLastFlipState] = useState(false)
  const [hasBeenFlipped, setHasBeenFlipped] = useState(false)
  const componentMountedRef = useRef(false)

  const isFlipped = extFlipped ?? localFlip
  const showNext  = showContinueButton ?? localShowNext

  // Auto-play audio when component mounts (Persian side for vocabulary)
  useEffect(() => {
    // Only play on initial mount, not on re-renders
    if (!componentMountedRef.current) {
      componentMountedRef.current = true;
      
      // Play Persian audio for vocabulary items
      if (vocabularyItem?.id) {
        AudioService.playVocabularyAudio(vocabularyItem.id);
      } else if (front) {
        // Fallback for legacy flashcard format
        const audioFile = getAudioFilename(front);
        if (audioFile) {
          AudioService.playAudio(`/audio/${audioFile}`);
        }
      }
    }
  }, [vocabularyItem?.id, front]);

  // Play audio when flip state changes
  useEffect(() => {
    // Only play audio if the flip state has actually changed
    if (isFlipped !== lastFlipState) {
      
      if (vocabularyItem?.id) {
        // Use AudioService for vocabulary-based flashcards (Persian only)
        if (isFlipped) {
          // Persian audio when showing finglish side
          AudioService.playVocabularyAudio(vocabularyItem.id);
        }
        // No audio when showing English side (front) - user can read English
      } else {
        // Fallback for legacy front/back format
        const audioFile = isFlipped 
          ? getAudioFilename(back || "") 
          : getAudioFilename(front || "");
        
        if (audioFile) {
          AudioService.playAudio(`/audio/${audioFile}`);
        }
      }
      
      // Update last flip state
      setLastFlipState(isFlipped);
      
      // Mark card as having been flipped at least once
      if (isFlipped && !hasBeenFlipped) {
        setHasBeenFlipped(true);
      }
    }
  }, [isFlipped, vocabularyItem?.id, front, back, lastFlipState, hasBeenFlipped]);

  const handleXpComplete = () => {
    // Reset local state
    setLocalFlip(false);
    setLocalShowNext(false);
    setShowXp(false);
    setHasBeenFlipped(false);
    // Call continue handler
    onContinue();
  }

  const handleFlip = () => {
    if (extFlip) {
      extFlip()
    } else {
      setLocalFlip(!localFlip)
      // Mark as flipped and enable continue button when flipping to back side
      if (!localFlip) {
        setHasBeenFlipped(true)
        setLocalShowNext(true)
      }
    }
  }

  function handleContinueClick() {
    // Play success sound when continuing
    playSuccessSound();
    
    // Award XP immediately when user clicks Continue
    if (onXpStart) {
      onXpStart();
    }
    
    // Trigger XP animation for visual feedback
    setShowXp(true);
  }

  return (
    <div className="w-full">
      <div className="text-center mb-2 sm:mb-4">
        <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-primary">
          NEW WORD
        </h2>
        <p className="text-sm xs:text-base text-muted-foreground">
          Click the card to see the Finglish translation
        </p>
      </div>

      <div className="relative p-3 sm:p-6 w-full sm:mt-[-30px]">
        <XpAnimation
          amount={points}
          show={showXp}
          onStart={undefined}
          onComplete={handleXpComplete}
        />

        <div className="w-full max-w-[600px] mx-auto">
          <div
            className="relative w-full aspect-[4/3] xs:aspect-[3/2] sm:aspect-[5/3] cursor-pointer touch-manipulation"
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleFlip()
            }}
          >
            {/* Front */}
            <div
              className={`absolute inset-0 bg-white rounded-xl shadow-sm p-3 sm:p-6 flex flex-col items-center justify-center border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 ${
                isFlipped ? "opacity-0 z-0" : "opacity-100 z-10"
              }`}
            >
              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-primary text-center px-2">
                {front || vocabularyItem?.en}
              </h2>
              <p className="text-xs xs:text-sm text-muted-foreground mt-1 sm:mt-2">Click to flip</p>
            </div>

            {/* Back */}
            <div
              className={`absolute inset-0 bg-white rounded-xl shadow-sm p-3 sm:p-6 flex flex-col items-center justify-center border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 ${
                isFlipped ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-primary text-center px-2">
                {back || vocabularyItem?.finglish}
              </h2>
              <p className="text-xs xs:text-sm text-muted-foreground mt-1 sm:mt-2">Click to flip back</p>
            </div>
          </div>
          
          {/* Pronunciation guide */}
          <div className="mt-3 sm:mt-4 mx-auto w-full sm:w-[calc(100%-2px)] max-w-[600px]">
            {isFlipped ? (
              /* After flip - single-row layout */
              <div className="bg-primary/5 rounded-lg p-2 sm:p-3 text-center shadow-sm min-h-[48px] flex items-center justify-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">How to say it:</span>
                <span role="img" aria-label="pronunciation" className="text-base sm:text-lg">🗣️</span>
                <span className="text-sm sm:text-base text-primary/90 font-semibold">
                  {vocabularyItem?.phonetic || getPronunciation(back || "")}
                </span>
              </div>
            ) : (
              /* Before flip */
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200 shadow-sm min-h-[48px] flex items-center justify-center gap-2">
                <span role="img" aria-label="locked" className="text-base sm:text-lg">🔒</span>
                <span className="text-sm sm:text-base text-muted-foreground">Flip the card to see pronunciation</span>
              </div>
            )}
          </div>
        </div>

        {/* Continue Button - Always visible but conditionally disabled */}
        <div className="mt-3 sm:mt-4 text-center">
          <div className="mx-auto w-full sm:max-w-[600px]">
            <Button
              className={`gap-2 w-full text-sm xs:text-base transition-colors duration-300 ${
                hasBeenFlipped ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-muted text-muted-foreground'
              }`}
              onClick={handleContinueClick}
              disabled={!hasBeenFlipped || showXp}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 