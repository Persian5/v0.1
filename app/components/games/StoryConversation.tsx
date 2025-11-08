import { useState, useEffect, useRef, useMemo } from 'react';
import { StoryConversationStep, StoryChoice as StoryChoiceType, StoryExchange } from '@/lib/types';
import { StoryProgressService } from '@/lib/services/story-progress-service';
import { ChatBubble } from './ChatBubble';
import { XpAnimation } from './XpAnimation';
import { TypingIndicator } from './TypingIndicator';
import { playSuccessSound } from './Flashcard';
import { motion } from 'framer-motion';
import { useAuth } from "@/components/auth/AuthProvider";

interface StoryConversationProps {
  step: StoryConversationStep;
  onComplete: () => void;
  onXpStart?: () => Promise<boolean>; // Returns true if XP granted, false if already completed
  addXp?: (amount: number, source: string, metadata?: any) => void; // Not used - XP awarded once via onXpStart
}

interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  exchangeId: string;
}

export function StoryConversation({ step, onComplete, onXpStart, addXp }: StoryConversationProps) {
  const { user } = useAuth();
  const authFirstName = user?.user_metadata?.first_name || 'Friend';
  const [userName, setUserName] = useState<string>(authFirstName);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showXp, setShowXp] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCharacterTyping, setIsCharacterTyping] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false) // Track if step was already completed (local state)
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const choicesRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const lastScrolledExchangeId = useRef<string | null>(null);
  const { data: storyData } = step;
  
  // Initialize story
  useEffect(() => {
    // Since all users are authenticated, always use auth first name
    if (authFirstName && authFirstName !== 'Friend') {
      setUserName(authFirstName);
    }
    
    // Cleanup function to reset story on unmount
    return () => {
      StoryProgressService.resetStoryProgress(storyData.storyId);
    };
  }, [authFirstName]);

  // Initialize story when ready
  useEffect(() => {
    if (!hasInitialized.current && userName) {
      initializeStory();
      hasInitialized.current = true;
    }
  }, [userName]);

  const initializeStory = () => {
    // Always start fresh - reset any existing progress
    StoryProgressService.resetStoryProgress(storyData.storyId);
    
    // Initialize new story progress
    StoryProgressService.initializeStoryProgress(
      storyData.storyId,
      storyData.exchanges.length,
      { name: userName }
    );
    setCurrentExchangeIndex(0);
    setProgress(0);
    
    // Reset all component state to initial values
    setChatHistory([]);
    setSelectedChoiceId(null);
    setShowResult(false);
    setShowXp(false);
    setIsCompleted(false);
    setIsCharacterTyping(false);
    
    // Start with appropriate typing indicator based on who initiates
    const firstExchange = storyData.exchanges[0];
    if (firstExchange) {
      if (firstExchange.initiator === 'user') {
        // User starts the conversation
        setIsUserTyping(true);
      } else if (firstExchange.initiator === 'character' && firstExchange.characterMessage) {
        const personalizedMessage = personalizeText(firstExchange.characterMessage);
        
        // Character starts - add message to history immediately, then show user typing
        const characterMessage: ChatMessage = {
          id: `character-init-${firstExchange.id}-${Date.now()}`,
          message: personalizedMessage,
          isUser: false,
          exchangeId: firstExchange.id
        };
        setChatHistory([characterMessage]);
        
        // After a brief moment, show user typing indicator for response
        setTimeout(() => {
          setIsUserTyping(true);
        }, 500);
      }
    }
  };

  const handleNameSubmit = (name: string) => {
    // This function is no longer used since all users are authenticated
    setUserName(name);
  };

  const getCurrentExchange = (): StoryExchange | null => {
    return storyData.exchanges[currentExchangeIndex] || null;
  };

  const personalizeText = (text: string): string => {
    return text
      .replace(/{name}/g, userName || 'Friend')
      .replace(/{characterName}/g, storyData.characterName);
  };

  // Helper function to capitalize first letter of sentences
  const capitalizeSentence = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const handleChoiceSelect = async (choice: StoryChoiceType) => {
    if (selectedChoiceId || showResult) return;
    
    setSelectedChoiceId(choice.id);
    setShowResult(true);

    // Handle correct choice
    if (choice.isCorrect) {
      // Add user's choice to chat history with personalization (ONLY for correct answers)
      const personalizedChoiceText = personalizeText(choice.text);
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        message: personalizedChoiceText,
        isUser: true,
        exchangeId: getCurrentExchange()?.id || ''
      };
      setChatHistory(prev => [...prev, userMessage]);

      // Play success sound for correct choice (no XP animation per choice)
      playSuccessSound();

      // Update progress
      StoryProgressService.updateProgress(
        storyData.storyId,
        true,
        true,
        choice.vocabularyUsed,
        true
      );

      // Wait for animations and user message to appear
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Show typing indicator if there's a response message
      if (choice.responseMessage) {
        setIsCharacterTyping(true);
        
        // Wait for typing animation (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add character response to chat history
        const characterMessage: ChatMessage = {
          id: `character-response-${Date.now()}`,
          message: personalizeText(choice.responseMessage),
          isUser: false,
          exchangeId: getCurrentExchange()?.id || ''
        };
        setChatHistory(prev => [...prev, characterMessage]);
        
        // Clear any remaining state after character response
        setIsCharacterTyping(false);
        setIsUserTyping(false);
      }

      // Wait a bit more before moving to next exchange
      await new Promise(resolve => setTimeout(resolve, 300));

      // Move to next exchange or complete
      if (currentExchangeIndex >= storyData.exchanges.length - 1) {
        // Story completed
        handleStoryCompletion();
      } else {
        // Calculate the next exchange index FIRST
        const nextExchangeIndex = currentExchangeIndex + 1;
        
        // Advance to next exchange
        setCurrentExchangeIndex(nextExchangeIndex);
        setProgress((nextExchangeIndex / storyData.exchanges.length) * 100);
        resetChoiceState();
        
        // Get the actual next exchange using the correct index
        const nextExchange = storyData.exchanges[nextExchangeIndex];
        if (nextExchange) {
          if (nextExchange.initiator === 'user') {
            setIsUserTyping(true);
          } else if (nextExchange.initiator === 'character' && nextExchange.characterMessage) {
            // Character-initiated exchange: add character message to history immediately
            // BUT FIRST: Check if this message is the same as the last message to avoid duplicates
            const personalizedCharacterMessage = personalizeText(nextExchange.characterMessage);
            
            // Use functional setState to access the most current chat history (including any just-added response messages)
            setChatHistory(currentChatHistory => {
              const lastMessage = currentChatHistory[currentChatHistory.length - 1];
              
              // Only add character message if it's different from the last message
              if (!lastMessage || lastMessage.message !== personalizedCharacterMessage || lastMessage.isUser) {
                const characterMessage: ChatMessage = {
                  id: `character-init-${nextExchange.id}-${Date.now()}`,
                  message: personalizedCharacterMessage,
                  isUser: false,
                  exchangeId: nextExchange.id
                };
                return [...currentChatHistory, characterMessage];
              }
              
              // No change needed - duplicate detected
              return currentChatHistory;
            });
            
            // After a brief moment, show user typing indicator for their response
            setTimeout(() => {
              setIsUserTyping(true);
            }, 500);
          } else {
            setIsUserTyping(false);
          }
        }
      }
    } else {
      // Wrong choice - show error animation and reset without adding message
      // DO NOT hide the typing indicator or choices - just wait for the shake animation
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Reset only the selected choice and result state, keep user typing active
      setSelectedChoiceId(null);
      setShowResult(false);
      setShowXp(false);
      
      // Reactivate user typing indicator so choices remain visible
      setIsUserTyping(true);
    }
  };

  const resetChoiceState = () => {
    setSelectedChoiceId(null);
    setShowResult(false);
    setShowXp(false);
  };

  const handleStoryCompletion = async () => {
    StoryProgressService.markStoryCompleted(storyData.storyId);
    setIsCompleted(true);
    
    // Award XP once for story completion (idempotent, back button safe)
    if (onXpStart) {
      const wasGranted = await onXpStart(); // Returns true if XP granted, false if already completed
      setIsAlreadyCompleted(!wasGranted); // Track if step was already completed
      
      // Show XP animation only if XP was granted
      if (wasGranted) {
        setShowXp(true);
        // Wait for XP animation before completing
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // Call onComplete to trigger lesson completion logic
    onComplete();
  };

  const restartStory = () => {
    // Reset initialization flag and let useEffect handle re-initialization
    hasInitialized.current = false;
    setChatHistory([]);
  };

  // REMOVED: Auto-scroll behavior
  // Messages now naturally stack upward (iMessage style)
  // Users scroll up to see history, new messages appear at bottom

  // Auto-scroll to choices when they first appear (desktop and mobile)
  useEffect(() => {
    const currentExchangeId = getCurrentExchange()?.id;
    
    // Only scroll if:
    // 1. User typing indicator is active (choices are visible)
    // 2. Current exchange has choices
    // 3. We haven't already scrolled for this exchange
    if (isUserTyping && currentExchangeId && currentExchangeId !== lastScrolledExchangeId.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        choicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        lastScrolledExchangeId.current = currentExchangeId;
      }, 100);
    }
  }, [isUserTyping, currentExchangeIndex]);

  const currentExchange = getCurrentExchange();

  // Shuffle choices for current exchange (like Quiz component)
  const shuffledChoices = useMemo(() => {
    if (!currentExchange?.choices) return [];
    // Shuffle choices once per exchange to randomize answer position
    return [...currentExchange.choices].sort(() => Math.random() - 0.5);
  }, [currentExchange?.id, currentExchange?.choices]);

  return (
    <div className="h-full w-full flex flex-col lg:flex-row bg-white">
      {/* Main Chat Area - 60% on desktop, Full Screen on Mobile */}
      <div className="flex-1 lg:flex-[3] flex flex-col bg-white">
        {/* Story Header - Fixed */}
        <div className="bg-white border-b px-4 py-3 text-center flex-shrink-0">
          <h3 className="font-semibold text-primary">{capitalizeSentence(storyData.title)}</h3>
          <p className="text-sm text-muted-foreground">{capitalizeSentence(storyData.setting)}</p>
        </div>

        {/* Chat Container - Scrollable Messages Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 lg:px-6"
        >
          {/* All Chat Messages from history */}
          {chatHistory.map(message => (
            <ChatBubble
              key={message.id}
              message={capitalizeSentence(message.message)}
              isUser={message.isUser}
              characterName={storyData.characterName}
              characterEmoji={storyData.characterEmoji}
            />
          ))}

          {/* Character Typing Indicator */}
          {isCharacterTyping && (
            <TypingIndicator
              characterName={storyData.characterName}
              characterEmoji={storyData.characterEmoji}
            />
          )}

          {/* User Typing Indicator */}
          {isUserTyping && !isCharacterTyping && (
            <div className="flex items-start gap-2 mb-2 justify-end">
              {/* Typing Bubble */}
              <div className="bg-blue-500 rounded-2xl px-4 py-3 max-w-xs">
                <div className="flex items-center gap-1">
                  {/* Animated dots */}
                  <motion.div
                    className="w-2 h-2 bg-blue-200 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0
                    }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-blue-200 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2
                    }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-blue-200 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4
                    }}
                  />
                </div>
              </div>
              
              {/* User Avatar */}
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm text-white">
                👤
              </div>
            </div>
          )}

          {/* Choice Section - Inline in message flow (both mobile and desktop) */}
          {!isCompleted && 
           currentExchange && 
           currentExchange.choices && 
           currentExchange.choices.length > 0 &&
           !isCharacterTyping && 
           isUserTyping && (
            <div 
              ref={choicesRef}
              className="space-y-3 px-2 py-3"
            >
              {/* Choice Instructions */}
              <p className="text-xs text-gray-500 text-center mb-3">
                Choose your response:
              </p>
              
              {/* Story Choices - Full-Width Stacked Bubbles */}
              <div className="flex flex-col gap-3 w-full max-w-3xl mx-auto">
                {shuffledChoices.map(choice => {
                  // Create a personalized version of the choice for display
                  const personalizedChoice = {
                    ...choice,
                    text: capitalizeSentence(personalizeText(choice.text))
                  };
                  
                  // Style based on state
                  const getButtonStyle = () => {
                    if (showResult && selectedChoiceId === choice.id) {
                      return choice.isCorrect 
                        ? 'bg-green-100 text-green-800 border-green-300 shadow-sm' 
                        : 'bg-red-100 text-red-800 border-red-300 shadow-sm animate-pulse';
                    }
                    
                    if (showResult) {
                      return 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed';
                    }
                    
                    return 'bg-white text-gray-800 border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm cursor-pointer active:bg-blue-100';
                  };
                  
                  return (
                    <motion.button
                      key={choice.id}
                      onClick={() => {
                        if (!showResult) {
                          handleChoiceSelect(choice);
                        }
                      }}
                      disabled={showResult}
                      className={`
                        w-full text-center px-6 py-4 rounded-full border transition-all duration-200
                        text-base font-medium shadow-sm
                        ${getButtonStyle()}
                      `}
                      animate={
                        showResult && selectedChoiceId === choice.id && !choice.isCorrect
                          ? { x: [0, -8, 8, -8, 8, 0], boxShadow: "0 0 0 3px rgba(239,68,68,0.3)" }
                          : { x: 0, boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
                      }
                      transition={{ 
                        x: { duration: 0.6, ease: "easeInOut" },
                        boxShadow: { duration: 0.6 }
                      }}
                    >
                      {personalizedChoice.text}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer - Fixed (only show when no choices) */}
        {(isCompleted || !currentExchange || !isUserTyping) && (
          <div className="bg-white border-t px-4 py-2 flex-shrink-0">
            <div className="text-center text-xs text-gray-400">
              {/* Space for future features */}
            </div>
          </div>
        )}
      </div>

      {/* Context Panel - 20% on desktop, Hidden on Mobile */}
      <div className="hidden lg:flex lg:flex-[1] lg:flex-col bg-white border-l border-gray-200 overflow-y-auto">
        {/* Character Info Section */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="text-center">
            <div className="text-6xl mb-3">{storyData.characterEmoji}</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{storyData.characterName}</h3>
            <p className="text-sm text-gray-600">Your conversation partner</p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h4 className="font-semibold text-gray-800 mb-3">Progress</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Conversation</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Exchange {currentExchangeIndex + 1}</span>
              <span>of {storyData.exchanges.length}</span>
            </div>
          </div>
        </div>

        {/* Vocabulary Hints Section */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h4 className="font-semibold text-gray-800 mb-3">Key Vocabulary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Salam</span>
              <span className="font-medium">Hello</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Chetori</span>
              <span className="font-medium">How are you?</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Khoobam</span>
              <span className="font-medium">I'm good</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Merci</span>
              <span className="font-medium">Thank you</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Khoshbakhtam</span>
              <span className="font-medium">Nice to meet you</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cultural Tips Panel - 20% on desktop, Hidden on Mobile */}
      <div className="hidden lg:flex lg:flex-[1] lg:flex-col bg-white border-l border-gray-200 overflow-y-auto">
        {/* Cultural Notes Header */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h4 className="font-semibold text-gray-800 text-center">Cultural Tips</h4>
        </div>

        {/* Cultural Tips Content */}
        <div className="flex-1 p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-medium text-blue-800 mb-2">💡 Greeting tip</p>
            <p className="text-sm text-gray-600">In Persian culture, it's polite to ask "Chetori?" (How are you?) after saying hello, even to people you just met.</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="font-medium text-green-800 mb-2">🤝 Meeting people</p>
            <p className="text-sm text-gray-600">"Khoshbakhtam" literally means "I am happy/pleased" and is the standard way to say "Nice to meet you."</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="font-medium text-purple-800 mb-2">🗣️ Pronunciation</p>
            <p className="text-sm text-gray-600">Persian is phonetic - words are pronounced exactly as they're written in Finglish!</p>
          </div>
        </div>
      </div>

      {/* XP Animation - Shows only at story completion */}
      {showXp && (
        <XpAnimation
          amount={step.points}
          show={showXp}
          isAlreadyCompleted={isAlreadyCompleted}
          onComplete={() => setShowXp(false)}
        />
      )}

      {/* Sentinel for scroll reference (no longer used for auto-scroll) */}
      <div ref={bottomRef} />
    </div>
  );
} 