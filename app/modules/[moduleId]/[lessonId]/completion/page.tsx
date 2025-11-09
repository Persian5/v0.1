"use client"

import { useParams, useSearchParams } from "next/navigation"
import { LessonRouteGuard } from "@/components/routes/LessonRouteGuard"
import CompletionView from "@/components/lesson/CompletionView"

export default function CompletionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  
  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : ''
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : ''
  
  const initialXpParamRaw = searchParams.get('xp')
  const parsed = initialXpParamRaw ? Number(initialXpParamRaw) : NaN
  const xpGained = Number.isFinite(parsed) ? parsed : undefined

  return (
    <LessonRouteGuard
      requireCompleted={true}
      isEmbedded={false}
    >
      <CompletionView 
        moduleId={moduleId}
        lessonId={lessonId}
        xpGained={xpGained}
      />
    </LessonRouteGuard>
  )
}
