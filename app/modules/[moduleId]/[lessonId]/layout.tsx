import { getModules } from '@/lib/config/curriculum'

// Generate static params for all module/lesson combinations
export async function generateStaticParams() {
  const modules = getModules()
  const params: { moduleId: string; lessonId: string }[] = []
  
  modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      params.push({
        moduleId: module.id,
        lessonId: lesson.id,
      })
    })
  })
  
  return params
}

// Server component layout
export default function LessonIdLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 