import { motion, AnimatePresence } from "framer-motion"

interface XpAnimationProps {
  amount: number
  show: boolean
  onStart?: () => void     // Called at animation start
  onComplete?: () => void  // Called at animation end
}

export function XpAnimation({ amount, show, onStart, onComplete }: XpAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{ opacity: 1, y: -20, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0 }}
          transition={{ duration: 0.8 }}
          onAnimationStart={onStart}
          onAnimationComplete={onComplete}
          className="absolute top-0 right-0 -mt-5 -mr-5 bg-green-100 text-green-700 rounded-full px-4 py-2 text-base font-bold shadow-md z-[1000]"
        >
          +{amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  )
} 