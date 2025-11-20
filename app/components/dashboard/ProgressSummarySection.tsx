"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Trophy, Award } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef, useEffect } from "react"

interface ProgressSummarySectionProps {
  wordsLearned: number
  masteredWords: number
  lessonsCompleted: number
  isLoading?: boolean
  shouldAnimate?: boolean
  onAnimationComplete?: () => void
}

export function ProgressSummarySection({ 
  wordsLearned, 
  masteredWords, 
  lessonsCompleted, 
  isLoading,
  shouldAnimate = true,
  onAnimationComplete
}: ProgressSummarySectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  // Mark animation as complete when section enters viewport
  useEffect(() => {
    if (isInView && shouldAnimate && onAnimationComplete) {
      onAnimationComplete()
    }
  }, [isInView, shouldAnimate, onAnimationComplete])
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white border border-neutral-200 shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      id: 'learned',
      icon: <BookOpen className="h-5 w-5" />,
      bgClass: "bg-primary/10 text-primary",
      value: wordsLearned,
      label: "Words Learned"
    },
    {
      id: 'mastered',
      icon: <Trophy className="h-5 w-5" />,
      bgClass: "bg-emerald-100 text-emerald-600",
      value: masteredWords,
      label: "Words Mastered"
    },
    {
      id: 'completed',
      icon: <Award className="h-5 w-5" />,
      bgClass: "bg-blue-100 text-blue-600",
      value: lessonsCompleted,
      label: "Lessons Completed"
    }
  ]

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={shouldAnimate ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
          animate={isInView && shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.04 }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <Card className="bg-white border border-neutral-200/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${card.bgClass} group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-neutral-900 tracking-tight">
                  {card.value}
                </p>
                <p className="text-sm font-medium text-neutral-500">
                  {card.label}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

