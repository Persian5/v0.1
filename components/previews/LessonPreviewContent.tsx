"use client"

import { getLessonVocabulary, getLessonSteps } from "@/lib/config/curriculum"
import { Lesson, Module } from "@/lib/types"

interface LessonPreviewContentProps {
  moduleId: string
  lessonId: string
  lesson: Lesson | null
  module: Module | null
}

/**
 * Reusable component for lesson preview content
 * Automatically generates preview from curriculum config - fully scalable
 */
export function LessonPreviewContent({ moduleId, lessonId, lesson, module }: LessonPreviewContentProps) {
  if (!lesson || !module) return null

  const lessonVocab = getLessonVocabulary(moduleId, lessonId)
  const steps = getLessonSteps(moduleId, lessonId)
  const previewVocab = lessonVocab.slice(0, 5)
  
  const stepCounts = {
    flashcard: steps.filter(s => s.type === 'flashcard').length,
    quiz: steps.filter(s => s.type === 'quiz' || s.type === 'reverse-quiz').length,
    input: steps.filter(s => s.type === 'input').length,
    matching: steps.filter(s => s.type === 'matching').length,
    story: steps.filter(s => s.type === 'story-conversation').length
  }

  return (
    <>
      {/* Lesson Header Preview */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">{lesson.emoji}</div>
        <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>
        <p className="text-lg text-muted-foreground mb-6">{lesson.description}</p>
      </div>

      {/* Vocabulary Preview */}
      {previewVocab.length > 0 && (
        <div className="w-full bg-white/50 rounded-lg p-6 mb-6 border border-primary/20">
          <h3 className="text-lg font-semibold mb-4 text-center">You'll learn these words:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {previewVocab.map((vocab) => (
              <div key={vocab.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{vocab.finglish}</div>
                  <div className="text-sm text-gray-600">{vocab.en}</div>
                </div>
                <div className="text-2xl">{vocab.fa}</div>
              </div>
            ))}
            {lessonVocab.length > 5 && (
              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">+{lessonVocab.length - 5} more words</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lesson Steps Preview */}
      <div className="w-full bg-white/50 rounded-lg p-6 border border-primary/20 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-center">Lesson includes:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stepCounts.flashcard > 0 && (
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-1">📚</div>
              <div className="text-sm font-medium">{stepCounts.flashcard} Flashcards</div>
            </div>
          )}
          {stepCounts.quiz > 0 && (
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl mb-1">✓</div>
              <div className="text-sm font-medium">{stepCounts.quiz} Quizzes</div>
            </div>
          )}
          {stepCounts.input > 0 && (
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl mb-1">✍️</div>
              <div className="text-sm font-medium">{stepCounts.input} Exercises</div>
            </div>
          )}
          {stepCounts.matching > 0 && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-1">🔗</div>
              <div className="text-sm font-medium">{stepCounts.matching} Matching</div>
            </div>
          )}
          {stepCounts.story > 0 && (
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <div className="text-2xl mb-1">💬</div>
              <div className="text-sm font-medium">{stepCounts.story} Conversation</div>
            </div>
          )}
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {steps.length} total activities
        </div>
      </div>
    </>
  )
}

