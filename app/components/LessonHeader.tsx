"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { useXp } from "@/hooks/use-xp"
import { XpService } from "@/lib/services/xp-service"
import { useAuth } from "@/components/auth/AuthProvider"

interface LessonHeaderProps {
  moduleId: string
}

export default function LessonHeader({ moduleId }: LessonHeaderProps) {
  const { xp } = useXp()
  const { user, signOut } = useAuth()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link href={`/modules/${moduleId}`} className="font-bold text-lg text-primary">
          <span className="hidden sm:inline">Module {moduleId.replace('module', '')}</span>
          <span className="sm:hidden">Module {moduleId.replace('module', '')}</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            <span className="text-sm font-medium">{XpService.formatXp(xp)}</span>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="bg-accent hover:bg-accent/90 text-white"
                onClick={() => router.push('/account')}
              >
                Account
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={signOut}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="bg-accent hover:bg-accent/90 text-white"
              onClick={() => router.push('/account')}
            >
              Account
            </Button>
          )}
        </div>
      </div>
    </header>
  )
} 