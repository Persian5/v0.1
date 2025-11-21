"use client"

import { motion } from "framer-motion"
import { Check, Lock, Play, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ModuleCardProps {
  id: string | number
  title: string
  description: string
  emoji: string
  uiState: 'completed' | 'in-progress' | 'start' | 'locked'
  buttonText: string
  onClick: (e: React.MouseEvent) => void
  index: number
}

export function ModuleCard({ 
  id, 
  title, 
  emoji, 
  description,
  uiState, 
  buttonText,
  onClick,
  index
}: ModuleCardProps) {
  const isLocked = uiState === 'locked'
  const isCompleted = uiState === 'completed'
  const isInProgress = uiState === 'in-progress'
  
  // Animation delay based on index
  const delay = index * 0.05

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col gap-4 p-6 rounded-2xl border shadow-sm transition-all duration-300",
        "bg-white border-[#E8EFE8]",
        !isLocked && "hover:-translate-y-1 hover:shadow-md",
        isLocked && "opacity-80 bg-slate-50/50 border-slate-100"
      )}
    >
      {/* Icon Tile */}
      <div className={cn(
        "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-2 transition-colors duration-300",
        isLocked 
          ? "bg-white border border-slate-200 grayscale opacity-60" 
          : "bg-[#E9F8EE] text-slate-900"
      )}>
        {emoji}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 flex-grow">
        <h3 className={cn(
          "text-xl font-semibold text-slate-900 leading-tight",
          isLocked && "text-slate-500"
        )}>
          {title}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
          {description}
        </p>
      </div>

      {/* Status & Action Area */}
      <div className="mt-auto pt-2 space-y-4">
        {/* Status Row */}
        <div className="flex items-center gap-2 text-xs font-medium min-h-[20px]">
          {isCompleted && (
            <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" />
              Completed
            </span>
          )}
          {isInProgress && (
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
              <Play className="w-3.5 h-3.5 fill-current" />
              In Progress
            </span>
          )}
          {isLocked && (
            <span className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              <Lock className="w-3.5 h-3.5" />
              Locked
            </span>
          )}
          {!isCompleted && !isInProgress && !isLocked && (
            <span className="flex items-center gap-1.5 text-[#1E7B57] bg-[#E9F8EE] px-2 py-1 rounded-full">
              <ArrowRight className="w-3.5 h-3.5" />
              Ready to Start
            </span>
          )}
        </div>

        {/* Button */}
        <Button
          onClick={onClick}
          disabled={isLocked}
          className={cn(
            "w-full font-semibold h-11 rounded-xl transition-all",
            isCompleted 
              ? "bg-transparent border-2 border-[#1E7B57] text-[#1E7B57] hover:bg-[#E9F8EE]" 
              : "bg-[#1E7B57] text-white hover:bg-[#166545] hover:shadow-md shadow-[#1E7B57]/20",
            isLocked && "bg-slate-100 text-slate-400 border-none cursor-not-allowed hover:bg-slate-100 shadow-none"
          )}
          variant={isCompleted ? "outline" : "default"}
        >
          {isLocked && <Lock className="w-4 h-4 mr-2" />}
          {buttonText}
        </Button>
      </div>
    </motion.div>
  )
}

