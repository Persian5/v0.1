import { motion, AnimatePresence } from "framer-motion"

interface XpAnimationProps {
  amount: number
  show: boolean
  isAlreadyCompleted?: boolean  // Show "Step Already Completed" instead of XP
  onStart?: () => void     // Called at animation start
  onComplete?: () => void  // Called at animation end
}

/**
 * XpAnimation - Professional, consistent XP feedback component
 * 
 * Design Philosophy:
 * - Fixed viewport positioning (always visible, scroll-independent)
 * - Aligned with heading, positioned to the right with spacing
 * - Self-contained (no wrapper divs needed)
 * - Subtle celebration (professional, not cartoonish)
 * 
 * Usage: Simply render <XpAnimation /> anywhere in your component.
 * The component handles all positioning automatically.
 */
export function XpAnimation({ amount, show, isAlreadyCompleted = false, onStart, onComplete }: XpAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.9 }}
          transition={{ 
            duration: 0.5,
            ease: "easeOut"
          }}
          onAnimationStart={onStart}
          onAnimationComplete={onComplete}
          className={`
            fixed top-[8.5rem] right-[20px] sm:top-[9rem] sm:right-[20px]
            rounded-full px-5 py-2.5
            text-base font-semibold shadow-md
            z-50
            pointer-events-none
            ${isAlreadyCompleted 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-green-100 text-green-700'
            }
          `}
        >
          {isAlreadyCompleted ? 'Step Already Completed' : `+${amount} XP`}
        </motion.div>
      )}
    </AnimatePresence>
  )
} 