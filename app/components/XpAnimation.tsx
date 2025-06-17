import { motion } from "framer-motion"

interface XpAnimationProps {
  amount: number
  show: boolean
  onStart?: () => void
  onComplete?: () => void
}

export function XpAnimation({ amount, show, onStart, onComplete }: XpAnimationProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8 }}
      className="absolute top-2 right-2 xs:-top-4 xs:-right-4 z-50"
      onAnimationStart={onStart}
      onAnimationComplete={onComplete}
    >
      <div className="bg-primary text-white rounded-full px-4 py-2 shadow-md">
        <span className="font-bold">+{amount} XP</span>
      </div>
    </motion.div>
  )
} 