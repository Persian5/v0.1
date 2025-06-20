"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Star } from "lucide-react"
import { getModule } from "@/lib/config/curriculum"
import { useParams } from "next/navigation"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"

export default function ModulePage() {
  const { moduleId } = useParams()
  const [progress, setProgress] = useState<{[key: string]: boolean}>({})

  // Get data from config
  const module = getModule(moduleId as string)
  
  useEffect(() => {
    // Load lesson progress when component mounts
    setProgress(LessonProgressService.getProgress())
  }, [])

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
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Link href="/modules" className="flex items-center gap-2 font-bold text-lg text-primary">
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back to Modules</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <Link href="/account">
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-white">
              Account
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Module Overview */}
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-primary/5">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary mb-4">
              {module.title}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Master the art of Persian {module.id.replace('module', '').toLowerCase() === '1' ? 'greetings' : module.description.split(' ')[1].toLowerCase()}
            </p>
          </div>
        </section>

        {/* Lessons Grid */}
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {lessons.map((lesson) => {
                const lessonKey = `${module.id}-${lesson.id}`
                const isCompleted = progress[lessonKey] || false
                const isAccessible = LessonProgressService.isLessonAccessible(module.id, lesson.id)
                const isLocked = !isAccessible
                
                return (
                  <Card
                    key={lesson.id}
                    className={`relative transition-all duration-300 hover:shadow-lg border-2 bg-white ${
                      isLocked ? "opacity-60 border-gray-200" : 
                      isCompleted ? "border-green-300 bg-green-50 hover:border-green-400" : 
                      "border-accent/30 hover:border-accent hover:scale-105"
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <CardTitle className="text-center">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight mb-3">
                          {lesson.title}
                        </h3>
                        {/* Single small status indicator */}
                        {isCompleted ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Completed
                          </div>
                        ) : isLocked ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            Locked
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Available
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm sm:text-base text-gray-600 text-center min-h-[60px] sm:min-h-[80px] flex items-center justify-center">
                        {lesson.description}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="w-full">
                        <Link href={`/modules/${module.id}/${lesson.id}`} className="block">
                          <Button
                            variant={isCompleted ? "outline" : "default"}
                            className={`w-full justify-between group py-3 font-semibold ${
                              isLocked ? "cursor-not-allowed bg-gray-100 text-gray-500" : 
                              isCompleted ? "border-green-300 text-green-700 hover:bg-green-50" :
                              "bg-accent hover:bg-accent/90 text-white"
                            }`}
                            disabled={isLocked}
                          >
                            <span className="flex-1 text-center">
                              {isLocked ? "Complete Previous" : isCompleted ? "Practice Again" : "Start Lesson"}
                            </span>
                            {!isLocked && <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                          </Button>
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
            
            {/* Progress Summary */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">
                  {Object.values(progress).filter(Boolean).length} of {lessons.length} lessons completed
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 