"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Sparkles } from "lucide-react"
import Link from "next/link"

interface WelcomeCardProps {
  nextLesson: {
    moduleId: string
    lessonId: string
    lessonTitle: string
    moduleTitle: string
  } | null
}

export function WelcomeCard({ nextLesson }: WelcomeCardProps) {
  const href = nextLesson 
    ? `/modules/${nextLesson.moduleId}/${nextLesson.lessonId}`
    : "/modules"
  
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-lg">
      <CardContent className="p-8 md:p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/10">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Welcome to Finglish!
        </h2>
        
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          You're about to start your Persian learning journey. Let's begin with your first lesson and build your vocabulary step by step.
        </p>
        
        <Link href={href}>
          <Button size="lg" className="text-lg px-8 py-6 min-h-[56px]">
            <BookOpen className="h-5 w-5 mr-2" />
            Start Your First Lesson
          </Button>
        </Link>
        
        <p className="text-sm text-muted-foreground mt-6">
          {nextLesson ? `${nextLesson.moduleTitle} • ${nextLesson.lessonTitle}` : 'Module 1 • Basic Persian Greetings'}
        </p>
      </CardContent>
    </Card>
  )
}

