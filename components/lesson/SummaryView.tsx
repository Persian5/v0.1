"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { getLesson } from "@/lib/config/curriculum"

interface SummaryViewProps {
  moduleId: string
  lessonId: string
  resetLesson?: () => void
}

export default function SummaryView({
  moduleId,
  lessonId,
  resetLesson
}: SummaryViewProps) {
  const router = useRouter()

  const lesson = getLesson(moduleId, lessonId)
  const isStoryLesson = lesson?.isStoryLesson || false
  const vocabulary = lesson?.vocabulary || []
  
  const formattedVocabulary = vocabulary.map(vocab => `${vocab.finglish} : ${vocab.en}`)
  const wordCount = vocabulary.length
  
  const navigateToPricing = () => {
    router.push('/pricing')
  }

  const navigateToNextLesson = async () => {
    try {
      const nextLesson = await LessonProgressService.getNextSequentialLesson(moduleId, lessonId)
      router.push(`/modules/${nextLesson.moduleId}/${nextLesson.lessonId}`)
    } catch (error) {
      console.error('Failed to navigate to next lesson:', error)
      router.push(`/modules/${moduleId}`)
    }
  }

  const handleReset = () => {
    if (resetLesson) {
      resetLesson()
    } else {
      router.push(`/modules/${moduleId}/${lessonId}`)
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center animate-fade-in w-full sm:w-auto py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Today&apos;s Achievements!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <ul className="space-y-4">
                {!isStoryLesson && wordCount > 0 && (
            <li>
              <div className="flex items-start">
                <div className="bg-green-100 p-1 rounded-full mr-3 mt-1">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                      <div className="flex-1">
                        <p className="font-medium">Learned {wordCount} essential Persian word{wordCount !== 1 ? 's' : ''}</p>
                        <div className="mt-2 space-y-1">
                          {formattedVocabulary.map((vocab, index) => (
                            <div key={index} className="bg-primary/5 p-2 rounded text-sm text-left">
                              {vocab}
                            </div>
                    ))}
                        </div>
                </div>
              </div>
            </li>
                )}
            
            <li>
              <div className="flex items-start">
                <div className="bg-green-100 p-1 rounded-full mr-3 mt-1">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Completed interactive challenges</p>
                  <p className="text-sm text-muted-foreground">
                        {isStoryLesson 
                          ? "Applied your knowledge in a story-based conversation practice"
                          : "Using flashcards, quizzes, and matching exercises to reinforce learning"
                        }
                  </p>
                </div>
              </div>
            </li>
            
            <li>
              <div className="flex items-start">
                <div className="bg-green-100 p-1 rounded-full mr-3 mt-1">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                      <p className="font-medium">
                        {isStoryLesson 
                          ? "Practiced conversation skills in context"
                          : "Applied skills in conversation practice"
                        }
                      </p>
                  <p className="text-sm text-muted-foreground">
                        {isStoryLesson
                          ? "Reinforced previously learned vocabulary through engaging storytelling"
                          : "Used greetings and phrases in realistic conversation scenarios"
                        }
                  </p>
                </div>
              </div>
            </li>
          </ul>
          
          <div className="bg-accent/10 p-4 rounded-lg space-y-3">
            <p className="font-semibold text-lg">
                  🔥 {isStoryLesson ? "Continue your Persian journey!" : "Next: More Greetings, Basic Politeness, and Essential Responses!"}
            </p>
            <p className="text-muted-foreground text-sm">
              Continue your Persian learning journey
            </p>
            <Button 
              className="w-full mt-2"
              onClick={navigateToNextLesson}
            >
              Next Lesson
            </Button>
          </div>
          
          <div className="pt-4 flex flex-col sm:flex-row justify-between gap-2">
            <Button 
              onClick={handleReset}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Practice Again
            </Button>
            
            <Button 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={navigateToPricing}
            >
              FAQ
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  )
}

