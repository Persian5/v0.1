"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { getLessonVocabulary } from "@/lib/config/curriculum"
import { Module, Lesson } from "@/lib/types"

interface ModulePreviewContentProps {
  module: Module | null
  lessons: Lesson[]
  accessibilityCache?: { [key: string]: boolean }
  badgeText?: string
  buttonText?: string
  showStats?: boolean
}

/**
 * Reusable component for module preview content
 * Automatically generates preview from curriculum config - fully scalable
 */
export function ModulePreviewContent({
  module,
  lessons,
  accessibilityCache = {},
  badgeText = "Sign up to unlock",
  buttonText = "Sign up to start",
  showStats = true
}: ModulePreviewContentProps) {
  if (!module) return null

  return (
    <>
      {/* Module Overview */}
      <section className="py-4 sm:py-8 lg:py-12 px-3 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary mb-2 sm:mb-4">
            {module.title}
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Master the art of Persian {module.id.replace('module', '').toLowerCase() === '1' ? 'greetings' : module.description.split(' ')[1].toLowerCase()}
          </p>
        </div>
      </section>

      {/* Lessons Grid - Enhanced Preview with Vocabulary */}
      <section className="py-4 sm:py-8 lg:py-12 px-3 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Module Stats Preview */}
          {showStats && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-4 px-4 py-2 bg-primary/10 rounded-full">
                <span className="text-sm font-medium text-primary">
                  {lessons.length} Lessons
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-sm font-medium text-primary">
                  {lessons.reduce((acc, lesson) => acc + (lesson.vocabulary?.length || 0), 0)} Words
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-sm font-medium text-primary">
                  {module.estimatedTime || '~30 min'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {lessons.map((lesson) => {
              const isAccessible = accessibilityCache[`${module.id}-${lesson.id}`] ?? false
              const isLocked = !isAccessible
              const lessonVocab = getLessonVocabulary(module.id, lesson.id)
              const previewVocab = lessonVocab.slice(0, 3) // Show first 3 words as preview
              
              return (
                <Card
                  key={lesson.id}
                  className={`relative transition-all duration-300 hover:shadow-lg border-2 bg-white ${
                    isLocked ? "opacity-60 border-gray-200" : 
                    "border-accent/30 hover:border-accent hover:scale-105"
                  }`}
                >
                  <CardHeader className="pb-2 sm:pb-4 pt-3 sm:pt-6 px-3 sm:px-6">
                    <CardTitle className="text-center">
                      <div className="text-2xl mb-2">{lesson.emoji}</div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 leading-tight mb-2 sm:mb-3">
                        {lesson.title}
                      </h3>
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                        {badgeText}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 sm:px-6 space-y-3">
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 text-center">
                      {lesson.description}
                    </p>
                    
                    {/* Vocabulary Preview */}
                    {previewVocab.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2 text-center">
                          You'll learn:
                        </p>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {previewVocab.map((vocab) => (
                            <span
                              key={vocab.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium"
                            >
                              <span className="text-gray-600">{vocab.finglish}</span>
                              <span className="text-gray-400">•</span>
                              <span>{vocab.en}</span>
                            </span>
                          ))}
                          {lessonVocab.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                              +{lessonVocab.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 pb-3 sm:pb-6 px-3 sm:px-6">
                    <Button
                      disabled
                      className="w-full justify-between group py-2 sm:py-3 font-semibold text-xs sm:text-sm cursor-not-allowed bg-gray-100 text-gray-500"
                    >
                      <span>{buttonText}</span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

