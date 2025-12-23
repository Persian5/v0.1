import { motion } from "framer-motion"
import { Check, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ModuleTileProps {
  id: string | number
  title: string
  emoji?: string
  description: string
  state: 'completed' | 'current' | 'available' | 'locked'
  progress?: number
  lessonCount?: number
  prerequisiteMessage?: string
  onClick: (e: React.MouseEvent) => void
  index: number
}

export function ModuleTile({ 
  id: _id, 
  title, 
  emoji, 
  description,
  state, 
  progress = 0,
  lessonCount,
  prerequisiteMessage,
  onClick,
  index
}: ModuleTileProps) {
  const isLocked = state === 'locked'
  const isCompleted = state === 'completed'
  const isCurrent = state === 'current'

  // "Lighter version of the current Iranopedia green (#1E7B57)"
  // 20% lighter than #2E9E74
  const activeGreen = "bg-[#4AB88A]"
  const activeBorder = "border-[#3A9E7A]"
  const activeShadow = "shadow-[#3A9E7A]"

  return (
    <div className="flex flex-col items-center gap-3 relative z-0 group w-full max-w-[312px]">
      <motion.button
        onClick={isLocked ? undefined : onClick}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
        whileHover={!isLocked ? { scale: 1.05, y: -5 } : {}}
        whileTap={!isLocked ? { scale: 0.95 } : {}}
        className={cn(
          "relative flex flex-col items-center justify-center w-36 h-36 sm:w-44 sm:h-44 rounded-[2.5rem] shadow-[0_8px_0_0_rgba(0,0,0,0.15)] transition-all duration-300 border-4 outline-none shrink-0 bg-white",
          // Colors based on state
          isCompleted && `${activeGreen} ${activeBorder} text-white ${activeShadow}`,
          isCurrent && "bg-amber-400 border-amber-500 text-white shadow-amber-600",
          state === 'available' && "bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-slate-200",
          isLocked && "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed shadow-none border-2"
        )}
      >
        {/* Lesson Count Badge */}
        {lessonCount !== undefined && (
          <div className="absolute -top-2 -right-2 bg-slate-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-20 border-2 border-white whitespace-nowrap">
            {lessonCount === 0 ? 'Coming Soon' : `${lessonCount} ${lessonCount === 1 ? 'Lesson' : 'Lessons'}`}
          </div>
        )}

        {/* Completion Checkmark Badge */}
        {isCompleted && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -left-2 bg-amber-400 text-white p-2 rounded-full shadow-sm z-20 border-4 border-white"
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
            {emoji || "📘"}
          </span>
        </div>

        {/* Prerequisite Message - Bottom of Square */}
        {isLocked && prerequisiteMessage && (
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center px-2 z-10">
            <p className="text-[10px] font-semibold text-slate-500 text-center leading-tight">
              {prerequisiteMessage}
            </p>
          </div>
        )}

        {/* Progress Bar (Inside Tile) */}
        {(progress > 0 || isCompleted) && !isLocked && (
          <div className="absolute bottom-6 w-24 h-3 bg-black/10 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress || (isCompleted ? 100 : 0)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                isCompleted || isCurrent ? "bg-white/90" : "bg-[#4AB88A]"
              )}
            />
          </div>
        )}
      </motion.button>
      
      {/* Text Label (Outside Tile) */}
      {/* VISUAL FIX: Ensure description is fully visible (no line-clamp) */}
      <div className={cn(
        "text-center space-y-1 w-full transition-opacity duration-300 md:block min-w-[234px]",
        isLocked ? "opacity-50 grayscale" : "opacity-100"
      )}>
        <h3 className="font-bold text-neutral-800 text-lg leading-tight">
          {title}
        </h3>
        <p className="text-sm font-medium text-neutral-500 leading-relaxed px-1 text-balance">
          {description}
        </p>
      </div>
    </div>
  )
}
