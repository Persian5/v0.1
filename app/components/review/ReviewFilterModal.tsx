"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookOpen, Trophy, AlertCircle } from "lucide-react"
import { ReviewFilter } from "@/lib/services/review-session-service"
import { cn } from "@/lib/utils"

interface ReviewFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onFilterSelect: (filter: ReviewFilter) => void
  currentFilter?: ReviewFilter
}

const FILTER_OPTIONS: Array<{
  id: ReviewFilter
  title: string
  description: string
  icon: React.ReactNode
}> = [
  {
    id: 'all-learned',
    title: 'All Learned Words',
    description: 'Practice all words you\'ve seen in lessons',
    icon: <BookOpen className="h-5 w-5" />
  },
  {
    id: 'mastered',
    title: 'Mastered Words',
    description: 'Review words you\'ve mastered (5+ correct in a row)',
    icon: <Trophy className="h-5 w-5" />
  },
  {
    id: 'hard-words',
    title: 'Words to Review',
    description: 'Focus on your most challenging words',
    icon: <AlertCircle className="h-5 w-5" />
  }
]

export function ReviewFilterModal({ 
  isOpen, 
  onClose, 
  onFilterSelect,
  currentFilter 
}: ReviewFilterModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<ReviewFilter>(currentFilter || 'all-learned')

  useEffect(() => {
    if (currentFilter) {
      setSelectedFilter(currentFilter)
    }
  }, [currentFilter])

  const handleFilterClick = (filter: ReviewFilter) => {
    setSelectedFilter(filter)
  }

  const handleConfirm = () => {
    onFilterSelect(selectedFilter)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Choose Your Words
          </DialogTitle>
          <DialogDescription className="text-center">
            Select which words you want to practice in review mode
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {FILTER_OPTIONS.map((option) => {
            const isSelected = selectedFilter === option.id
            return (
              <button
                key={option.id}
                onClick={() => handleFilterClick(option.id)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/10 hover:bg-primary/15"
                    : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "mt-1 flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-semibold text-sm mb-1",
                    isSelected ? "text-primary" : "text-gray-900"
                  )}>
                    {option.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Start Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

