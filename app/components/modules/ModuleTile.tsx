import { motion } from "framer-motion"
import { Check, Lock, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ModuleTileProps {
  id: string | number
  title: string
  emoji: string
  description: string
  state: 'completed' | 'current' | 'available' | 'locked'
  progress?: number
  onClick: (e: React.MouseEvent) => void
  index: number
}

export function ModuleTile({ 
  id, 
  title, 
  emoji, 
  description,
  state, 
  progress = 0,
  onClick,
  index
}: ModuleTileProps) {
  const isLocked = state === 'locked'
  const isCompleted = state === 'completed'
  const isCurrent = state === 'current'

  return (
    <div className="flex flex-col items-center gap-4 relative z-0 group">
      <motion.button
        onClick={isLocked ? undefined : onClick}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
        whileHover={!isLocked ? { scale: 1.05, y: -5 } : {}}
        whileTap={!isLocked ? { scale: 0.95 } : {}}
        className={cn(
          "relative flex flex-col items-center justify-center w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] shadow-[0_8px_0_0_rgba(0,0,0,0.15)] transition-all duration-300 border-4 outline-none",
          // Colors based on state
          isCompleted && "bg-[#58cc02] border-[#46a302] text-white shadow-[#46a302]",
          isCurrent && "bg-amber-400 border-amber-500 text-white shadow-amber-600",
          state === 'available' && "bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-slate-200",
          isLocked && "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed shadow-none border-2"
        )}
      >
        {/* Completion Checkmark Badge */}
        {isCompleted && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-yellow-400 text-white p-2 rounded-full shadow-sm z-20 border-4 border-white"
          >
            <Check className="w-5 h-5 stroke-[4]" />
          </motion.div>
        )}

        {/* Current indicator (floating crown/star) */}
        {isCurrent && (
          <motion.div
            animate={{ y: [-8, 0, -8] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute -top-10 text-amber-400 z-20"
          >
            <div className="bg-white p-2.5 rounded-xl shadow-sm border-2 border-amber-100">
              <Star className="w-6 h-6 fill-amber-400 stroke-amber-400" />
            </div>
          </motion.div>
        )}

        {/* Emoji */}
        <div className="flex flex-col items-center justify-center z-10">
          <span className={cn(
            "text-5xl sm:text-6xl filter drop-shadow-sm transition-all",
            isLocked && "grayscale opacity-40 scale-90"
          )}>
            {emoji}
          </span>
          
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
               <Lock className="w-8 h-8 text-slate-400 opacity-60" />
            </div>
          )}
        </div>

        {/* Progress Bar (Inside Tile) */}
        {/* Only show for modules that have progress > 0 (including completed) */}
        {(progress > 0 || isCompleted) && !isLocked && (
          <div className="absolute bottom-6 w-20 h-2.5 bg-black/10 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress || (isCompleted ? 100 : 0)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                isCompleted || isCurrent ? "bg-white/90" : "bg-[#58cc02]"
              )}
            />
          </div>
        )}
      </motion.button>
      
      {/* Text Label (Outside Tile) */}
      <div className={cn(
        "text-center space-y-1 max-w-[160px] transition-opacity duration-300",
        isLocked ? "opacity-50 grayscale" : "opacity-100"
      )}>
        <h3 className="font-bold text-neutral-800 text-lg leading-tight">
          {title}
        </h3>
        <p className="text-xs font-medium text-neutral-500 leading-relaxed px-2">
          {description}
        </p>
      </div>
    </div>
  )
}
