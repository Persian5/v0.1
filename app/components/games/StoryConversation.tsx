import { useState, useEffect, useRef, useMemo } from 'react';
import { StoryConversationStep, StoryChoice as StoryChoiceType, StoryExchange } from '@/lib/types';
import { StoryProgressService } from '@/lib/services/story-progress-service';
import { ChatBubble } from './ChatBubble';
import { NameInput } from './NameInput';
import { XpAnimation } from './XpAnimation';
import { TypingIndicator } from './TypingIndicator';
import { playSuccessSound } from './Flashcard';
import { motion } from 'framer-motion';
import { useAuth } from "@/components/auth/AuthProvider";

interface StoryConversationProps {
  step: StoryConversationStep;
  onComplete: () => void;
  onXpStart?: () => Promise<boolean> // Returns true if XP granted, false if already completed; // Not used - XP awarded per-choice via addXp instead
  addXp?: (amount: number, source: string, metadata?: any) => void;
}

interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  exchangeId: string;
}

export function StoryConversation({ step, onComplete, onXpStart, addXp }: StoryConversationProps) {
  const [needsName, setNeedsName] = useState(false);
  const { user } = useAuth();
  const authFirstName = user?.user_metadata?.first_name || '';
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
  const hasInitialized = useRef(false);
  const prevIsUserTyping = useRef(false);
  const { data: storyData } = step;
  
  // Initialize story
  useEffect(() => {
    // Check if user needs to input name
    if (storyData.requiresPersonalization) {
      const existingName = StoryProgressService.getUserName();
      if (existingName === 'Friend') {
        if (authFirstName) {
          setUserName(authFirstName);
          StoryProgressService.setUserName(authFirstName);
        } else {
          setNeedsName(true);
          return;
        }
      } else {
        setUserName(existingName);
      }
    }
    
    // Cleanup function to reset story on unmount
    return () => {
      StoryProgressService.resetStoryProgress(storyData.storyId);
    };
  }, []);

  // Initialize story when ready
  useEffect(() => {
    // Only initialize if we have a name (or don't need one) and haven't initialized yet
    if (!needsName && !hasInitialized.current) {
      // Ensure we have userName if personalization is required
      if (storyData.requiresPersonalization && !userName) {
        return; // Wait for userName to be set
      }
      initializeStory();
      hasInitialized.current = true;
    }
  }, [needsName, userName]); // userName needed to trigger when name becomes available

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
    setUserName(name);
    StoryProgressService.setUserName(name);
    setNeedsName(false);
  };

  const getCurrentExchange = (): StoryExchange | null => {
    return storyData.exchanges[currentExchangeIndex] || null;
  };

  const personalizeText = (text: string): string => {
    return text
      .replace(/{name}/g, userName || authFirstName || 'Friend')
      .replace(/{characterName}/g, storyData.characterName);
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

      // Award XP for correct first-try choice
      if (choice.points > 0 && addXp) {
        addXp(choice.points, 'story-choice', {
          activityType: 'story-conversation',
          storyId: storyData.storyId,
          exchangeIndex: currentExchangeIndex
        });
        setShowXp(true);
        playSuccessSound();
      }

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

  const handleStoryCompletion = () => {
    StoryProgressService.markStoryCompleted(storyData.storyId);
    setIsCompleted(true);
    
    // Note: XP is awarded per-choice via addXp(choice.points)
    // No additional completion bonus needed - step.points should be 0
    
    // Call onComplete immediately to trigger module completion logic
    onComplete();
  };

  const restartStory = () => {
    // Reset initialization flag and let useEffect handle re-initialization
    hasInitialized.current = false;
    setChatHistory([]);
  };

  // Auto-scroll to bottom when new messages are added (iMessage-style)
  useEffect(() => {
    // Use requestAnimationFrame for smoother, non-conflicting scroll
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [chatHistory]);

  // Auto-scroll when user typing STARTS (only on state change false -> true)
  useEffect(() => {
    // Only scroll if isUserTyping changed from false to true
    if (isUserTyping && !prevIsUserTyping.current) {
      // Delay slightly to ensure choices are rendered before scrolling
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
    // Update the ref to track current state for next render
    prevIsUserTyping.current = isUserTyping;
  }, [isUserTyping]);

  // Show name input if needed
  if (needsName) {
    return (
      <div className="h-full flex items-center justify-center">
        <NameInput onNameSubmit={handleNameSubmit} />
      </div>
    );
  }

  const currentExchange = getCurrentExchange();

  // Shuffle choices for current exchange (like Quiz component)
  const shuffledChoices = useMemo(() => {
    if (!currentExchange?.choices) return [];
    // Shuffle choices once per exchange to randomize answer position
    return [...currentExchange.choices].sort(() => Math.random() - 0.5);
  }, [currentExchange?.id, currentExchange?.choices]);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-gray-50">
      {/* Main Chat Area - Left Side on Desktop */}
      <div className="flex-1 lg:flex-[2] flex flex-col bg-gray-50">
        {/* Story Header */}
        <div className="bg-white border-b px-4 py-3 text-center lg:text-left">
          <h3 className="font-semibold text-primary">{storyData.title}</h3>
          <p className="text-sm text-muted-foreground">{storyData.setting}</p>
        </div>

        {/* Chat Container - Wider on desktop */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 pb-6 lg:px-6"
          style={{ minHeight: '400px' }}
        >
          {/* All Chat Messages from history */}
          {chatHistory.map(message => (
            <ChatBubble
              key={message.id}
              message={message.message}
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

          {/* Choice Bubbles - Wider on desktop */}
          {!isCompleted && 
           currentExchange && 
           currentExchange.choices && 
           currentExchange.choices.length > 0 &&
           !isCharacterTyping && 
           isUserTyping && (
            <div className="space-y-3 px-2 py-3">
              {/* Choice Instructions */}
              <p className="text-xs text-gray-500 text-center">
                Choose your response:
              </p>
              
              {/* Story Choices - Responsive grid on desktop */}
              <div className="flex flex-col gap-2 max-w-md lg:max-w-2xl mx-auto w-full lg:grid lg:grid-cols-2 lg:gap-3">
                {shuffledChoices.map(choice => {
                  // Create a personalized version of the choice for display
                  const personalizedChoice = {
                    ...choice,
                    text: personalizeText(choice.text)
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
                        text-center px-4 py-3 rounded-full border transition-all duration-200
                        text-sm font-medium shadow-sm w-full lg:text-base lg:py-4
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

        {/* Bottom area - minimal since choices are in chat */}
        <div className="bg-white border-t px-4 py-2">
          <div className="text-center text-xs text-gray-400">
            {/* Space for future features */}
          </div>
        </div>
      </div>

      {/* Context Panel - Right Side on Desktop, Hidden on Mobile */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col bg-white border-l border-gray-200">
        {/* Character Info Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="text-center">
            <div className="text-6xl mb-3">{storyData.characterEmoji}</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{storyData.characterName}</h3>
            <p className="text-sm text-gray-600">Your conversation partner</p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-gray-100">
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
        <div className="p-6 border-b border-gray-100">
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

        {/* Cultural Notes Section */}
        <div className="flex-1 p-6">
          <h4 className="font-semibold text-gray-800 mb-3">Cultural Tips</h4>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-blue-800 mb-1">💡 Greeting Tip</p>
              <p>In Persian culture, it's polite to ask "Chetori?" (How are you?) after saying hello, even to people you just met.</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="font-medium text-green-800 mb-1">🤝 Meeting People</p>
              <p>"Khoshbakhtam" literally means "I am happy/pleased" and is the standard way to say "Nice to meet you."</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="font-medium text-purple-800 mb-1">🗣️ Pronunciation</p>
              <p>Persian is phonetic - words are pronounced exactly as they're written in Finglish!</p>
            </div>
          </div>
        </div>
      </div>

      {/* XP Animation */}
      {showXp && (
        <XpAnimation
          amount={1}
          show={showXp}
          isAlreadyCompleted={isAlreadyCompleted}
          onComplete={() => setShowXp(false)}
        />
      )}

      {/* Sentinel for auto page scroll */}
      <div ref={bottomRef} />
    </div>
  );
} 