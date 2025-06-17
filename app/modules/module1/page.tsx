"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { getModule } from "@/lib/config/curriculum"

export default function Module1Page() {
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const module = getModule("module1")
  
  // If module isn't found, handle gracefully
  if (!module) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Module not found</p>
      </div>
    )
  }

  const lessons = module.lessons

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-3 sm:px-4">
          <Link href="/modules" className="flex items-center gap-2 font-bold text-base sm:text-lg text-primary">
            <ChevronLeft className="h-5 w-5" />
            <span>Modules</span>
          </Link>
          <Link href="/">
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-white">
              Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Module Overview */}
        <section className="py-8 px-3 sm:px-4 bg-primary/10">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-primary mb-3">
              {module.title}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-5">
              Master the art of Persian greetings and basic conversations
            </p>
          </div>
        </section>

        {/* Lessons Grid */}
        <section className="py-8 px-3 sm:px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
              {lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  className={`border-primary/20 shadow-sm hover:shadow-md transition-shadow rounded-xl ${
                    lesson.locked ? "opacity-50" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                      <span className="text-2xl sm:text-3xl">{lesson.emoji}</span>
                      {lesson.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base sm:text-lg">{lesson.description}</p>
                  </CardContent>
                  <CardFooter className="py-4">
                    <Link href={`/modules/module1/${lesson.id === 'lesson1' ? 'lesson1' : lesson.id}`} className="w-full">
                      <Button
                        variant="outline"
                        className={`w-full justify-between group hover:bg-primary/10 py-6 text-lg ${
                          lesson.locked ? "cursor-not-allowed" : ""
                        }`}
                        disabled={lesson.locked}
                      >
                        {lesson.locked ? "Locked" : "Start Lesson"}
                        {!lesson.locked && <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 