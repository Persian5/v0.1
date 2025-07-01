"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LessonProgressService } from "@/lib/services/lesson-progress-service"
import LessonHeader from "@/app/components/LessonHeader"

interface SummaryPageProps {
  learnedWords: string[];
  xp?: number;
  resetLesson?: () => void;
}

export default function SummaryPage({
  learnedWords,
  xp = 0,
  resetLesson
}: SummaryPageProps) {
  const router = useRouter()
  const { moduleId, lessonId } = useParams()

  // Safety check for empty learned words
  const wordsToShow = learnedWords || [];
  const wordCount = wordsToShow.length;
  
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
              {/* Word List */}
              <ul className="space-y-4">
                <li>
                  <div className="flex items-start">
                    <div className="bg-green-100 p-1 rounded-full mr-3 mt-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Learned {wordCount} essential Persian words</p>
                      <ul className="grid grid-cols-2 gap-2 mt-2">
                        {wordsToShow.map((word, index) => (
                          <li key={index} className="bg-primary/5 p-2 rounded">{word}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
                
                {/* Challenges Completed */}
                <li>
                  <div className="flex items-start">
                    <div className="bg-green-100 p-1 rounded-full mr-3 mt-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Completed interactive challenges</p>
                      <p className="text-sm text-muted-foreground">
                        Using flashcards, quizzes, and matching exercises to reinforce learning
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
                      <p className="font-medium">Applied skills in conversation practice</p>
                      <p className="text-sm text-muted-foreground">
                        Used greetings and phrases in realistic conversation scenarios
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
              
              {/* Next Lesson Teaser */}
              <div className="bg-accent/10 p-4 rounded-lg space-y-3">
                <p className="font-semibold text-lg">
                  🔥 Next: More Greetings, Basic Politeness, and Essential Responses!
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