import { getModules } from '@/lib/config/curriculum'

// Generate static params for all module/lesson completion pages
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
export default function CompletionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 