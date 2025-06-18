import { getModules } from '@/lib/config/curriculum'

// Generate static params for all modules
export async function generateStaticParams() {
  const modules = getModules()
  return modules.map((module) => ({
    moduleId: module.id,
  }))
}

// Server component layout
export default function ModuleIdLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 