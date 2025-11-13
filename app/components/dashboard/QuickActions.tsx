"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Target, Grid3x3 } from "lucide-react"
import Link from "next/link"

interface QuickAction {
  label: string
  icon: React.ReactNode
  href: string
  description: string
  variant: "default" | "secondary" | "outline"
}

const actions: QuickAction[] = [
  {
    label: "Continue Learning",
    icon: <BookOpen className="h-5 w-5" />,
    href: "/modules",
    description: "Pick up where you left off",
    variant: "default"
  },
  {
    label: "Practice Weak Words",
    icon: <Target className="h-5 w-5" />,
    href: "/review",
    description: "Focus on words you're struggling with",
    variant: "secondary"
  },
  {
    label: "Browse Modules",
    icon: <Grid3x3 className="h-5 w-5" />,
    href: "/modules",
    description: "Explore all lessons",
    variant: "outline"
  }
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {actions.map((action, index) => {
        // Make "Continue Learning" primary (larger, different style)
        const isPrimary = index === 0
        
        return (
          <Link key={action.label} href={action.href}>
            <Card className={`
              h-full transition-all cursor-pointer
              bg-white border border-neutral-200 shadow-sm hover:shadow-md
              ${isPrimary ? 'md:col-span-2 lg:col-span-1 border-primary/30 bg-primary/5' : ''}
            `}>
              <CardContent className={`p-4 md:p-6 flex flex-col items-center text-center space-y-3 min-h-[48px] justify-center`}>
                <div className={`p-3 rounded-lg ${isPrimary ? 'bg-primary/10 text-primary' : 'bg-neutral-100 text-neutral-600'}`}>
                  {action.icon}
                </div>
                <div className="space-y-1">
                  <h3 className={`font-semibold ${isPrimary ? 'text-lg' : 'text-base'}`}>
                    {action.label}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

