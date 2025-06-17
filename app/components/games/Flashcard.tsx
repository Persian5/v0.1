import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { XpAnimation } from "@/app/components/games/XpAnimation"

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
  front: string
  back: string
  points?: number
  onContinue: () => void
  onXpStart?: () => void
  isFlipped?: boolean
  onFlip?: () => void
  showContinueButton?: boolean
}

// Helper function to convert card text to audio filename
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

// First, need to add a helper function to get the pronunciation for each Persian word
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const componentMountedRef = useRef(false)

  const isFlipped = extFlipped ?? localFlip
  const showNext  = showContinueButton ?? localShowNext

  // Auto-play English audio when component mounts
  useEffect(() => {
    // Only play on initial mount, not on re-renders
    if (!componentMountedRef.current) {
      componentMountedRef.current = true;
      
      const audioFile = getAudioFilename(front);
      
      if (audioFile) {
        const audio = new Audio(`/audio/${audioFile}`);
        audioRef.current = audio;
        
        // Play the audio and handle any errors
        audio.play().catch(error => {
          console.error("Error playing initial audio:", error);
        });
      }
    }
  }, [front]);

  // Play audio when flip state changes
  useEffect(() => {
    // Only play audio if the flip state has actually changed
    if (isFlipped !== lastFlipState) {
      const audioFile = isFlipped 
        ? getAudioFilename(back) 
        : getAudioFilename(front);
      
      if (audioFile) {
        // Create a new audio instance each time to ensure it plays
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(`/audio/${audioFile}`);
        audioRef.current = audio;
        
        // Play the audio and handle any errors
        audio.play().catch(error => {
          console.error("Error playing audio:", error);
        });
      }
      
      // Update last flip state
      setLastFlipState(isFlipped);
      
      // Mark card as having been flipped at least once
      if (isFlipped && !hasBeenFlipped) {
        setHasBeenFlipped(true);
      }
    }
  }, [isFlipped, front, back, lastFlipState, hasBeenFlipped]);

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
    
    // Don't award XP here - it will be handled by XpAnimation
    // Trigger XP animation
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
          onStart={onXpStart}
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
                {front}
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
                {back}
              </h2>
              <p className="text-xs xs:text-sm text-muted-foreground mt-1 sm:mt-2">Click to flip back</p>
            </div>
          </div>
          
          {/* Pronunciation guide - two different states based on flip */}
          <div className="mt-3 sm:mt-4 mx-auto w-full sm:w-[calc(100%-2px)] max-w-[600px]">
            {isFlipped ? (
              /* After flip - actual pronunciation */
              <div className="bg-primary/5 rounded-lg p-2 sm:p-3 text-center shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">How to say it:</p>
                <div className="flex items-center justify-center gap-2">
                  <span role="img" aria-label="pronunciation" className="text-base sm:text-lg">🗣️</span>
                  <p className="text-sm sm:text-base text-primary/90 font-semibold">
                    {getPronunciation(back)}
                  </p>
                </div>
              </div>
            ) : (
              /* Before flip - locked pronunciation */
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200 shadow-sm">
                <div className="flex items-center justify-center gap-2">
                  <span role="img" aria-label="locked" className="text-base sm:text-lg">🔒</span>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Flip the card to see pronunciation
                  </p>
                </div>
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