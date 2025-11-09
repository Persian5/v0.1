"use client"

import { useParams } from "next/navigation"
import { LessonRouteGuard } from "@/components/routes/LessonRouteGuard"
import SummaryView from "@/components/lesson/SummaryView"

export default function SummaryPage() {
  const params = useParams()
  
  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : ''
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : ''

  return (
    <LessonRouteGuard
      requireAccess={true}
      isEmbedded={false}
    >
      <SummaryView 
        moduleId={moduleId}
        lessonId={lessonId}
      />
    </LessonRouteGuard>
  )
}
