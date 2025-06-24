import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  characterName: string;
  characterEmoji: string;
}

export function TypingIndicator({ characterName, characterEmoji }: TypingIndicatorProps) {
  return (
    <div className="flex items-start gap-2 mb-2">
      {/* Character Avatar */}
      <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm">
        {characterEmoji}
      </div>
      
      {/* Typing Bubble */}
      <div className="bg-gray-200 rounded-2xl px-4 py-3 max-w-xs">
        <div className="flex items-center gap-1">
          {/* Animated dots */}
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
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
            className="w-2 h-2 bg-gray-400 rounded-full"
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
            className="w-2 h-2 bg-gray-400 rounded-full"
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
    </div>
  );
} 