"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Zap, BookOpen, Flame } from "lucide-react"
import { useStreak } from "@/hooks/use-streak"
import { motion, useInView } from "framer-motion"
import { useRef, useEffect } from "react"

interface TodayStatsSectionProps {
  xpEarned: number
  lessonsCompleted: number
  streak: number
  isLoading?: boolean
  shouldAnimate?: boolean
  onAnimationComplete?: () => void
}

export function TodayStatsSection({ xpEarned, lessonsCompleted, streak: _unused, isLoading, shouldAnimate = true, onAnimationComplete }: TodayStatsSectionProps) {
  // Use the same hook as the old DashboardHero component for live streak updates
  const { streak, isLoading: streakLoading } = useStreak()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  // Mark animation as complete when section enters viewport
  useEffect(() => {
    if (isInView && shouldAnimate && onAnimationComplete) {
      onAnimationComplete()
    }
  }, [isInView, shouldAnimate, onAnimationComplete])
  
  const anyLoading = isLoading || streakLoading
  if (anyLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white border border-neutral-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = [
    {
      id: 'xp',
      icon: <Zap className="w-6 h-6 fill-current" />,
      bgClass: "bg-amber-100/50 text-amber-600",
      value: xpEarned,
      label: "XP Today"
    },
    {
      id: 'lessons',
      icon: <BookOpen className="w-6 h-6" />,
      bgClass: "bg-emerald-100/50 text-emerald-600",
      value: lessonsCompleted,
      label: "Lessons Today"
    },
    {
      id: 'streak',
      icon: <Flame className="w-6 h-6 fill-current" />,
      bgClass: "bg-orange-100/50 text-orange-600",
      value: streak,
      label: "Day Streak",
      suffix: "days",
      subtext: "Keep going!",
      subtextClass: "text-orange-500"
    }
  ]

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial={shouldAnimate ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
          animate={isInView && shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.04 }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <Card className="bg-white border border-neutral-200/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3.5 rounded-xl flex-shrink-0 ${stat.bgClass}`}>
                {stat.icon}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                  {stat.suffix && <p className="text-sm font-medium text-neutral-500">{stat.suffix}</p>}
                </div>
                <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                {stat.subtext && (
                  <p className={`text-xs font-medium mt-0.5 ${stat.subtextClass}`}>{stat.subtext}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

