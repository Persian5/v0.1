"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import { getLesson } from "@/lib/config/curriculum"
import LessonHeader from "@/app/components/LessonHeader"
import { LessonRouteGuard } from "@/components/routes/LessonRouteGuard"

interface SummaryPageProps {
  learnedWords: string[];
  xp?: number;
  resetLesson?: () => void;
}

function SummaryPageContent({
  learnedWords,
  xp = 0,
  resetLesson
}: SummaryPageProps) {
  const router = useRouter()
  const { moduleId, lessonId } = useParams()

  // Get lesson data to access vocabulary and check if it's a story lesson
  const lesson = getLesson(moduleId as string, lessonId as string)
  const isStoryLesson = lesson?.isStoryLesson || false
  const vocabulary = lesson?.vocabulary || []
  
  // Format vocabulary as "finglish : english"
  const formattedVocabulary = vocabulary.map(vocab => `${vocab.finglish} : ${vocab.en}`)
  const wordCount = vocabulary.length
  
  // Function to navigate to pricing page
  const navigateToPricing = () => {
    router.push('/pricing')
  }

  // Function to navigate to next lesson
  const navigateToNextLesson = async () => {
    try {
      const nextLesson = await LessonProgressService.getNextSequentialLesson(
      moduleId as string, 
      lessonId as string
    );
    router.push(`/modules/${nextLesson.moduleId}/${nextLesson.lessonId}`);
    } catch (error) {
      console.error('Failed to navigate to next lesson:', error);
      router.push(`/modules/${moduleId}`);
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LessonHeader moduleId={moduleId as string} />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center animate-fade-in w-full sm:w-auto py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Today's Achievements!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
              {/* Word List - Only show for non-story lessons */}
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
            
            {/* Challenges Completed */}
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
            
            {/* Real-World Impact */}
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
          
          {/* Next Lesson Teaser */}
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
          
          {/* Footer Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row justify-between gap-2">
            <Button 
              onClick={resetLesson}
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

export default function SummaryPage(props: SummaryPageProps) {
  // Check if this is embedded context (props passed from parent) or standalone route
  // If resetLesson prop is provided, it's embedded in lesson page (already authorized)
  // If no resetLesson, it's standalone route access (needs guard check)
  const isEmbedded = typeof props.resetLesson === 'function'
  
  return (
    <LessonRouteGuard
      requireAccess={true}
      isEmbedded={isEmbedded}
    >
      <SummaryPageContent {...props} />
    </LessonRouteGuard>
  )
} 