"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, AlertCircle } from "lucide-react"

interface NotFoundProps {
  type: 'module' | 'lesson'
  moduleId?: string
  lessonId?: string
}

/**
 * User-friendly 404 component for invalid module/lesson IDs
 * Matches site theme and provides clear navigation options
 */
export function NotFound({ type, moduleId, lessonId }: NotFoundProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4 max-w-md">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-100 p-4">
            <AlertCircle className="h-12 w-12 text-amber-600" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {type === 'module' ? 'Module Not Found' : 'Lesson Not Found'}
          </h1>
          <p className="text-muted-foreground">
            {type === 'module' 
              ? `The module "${moduleId || 'unknown'}" doesn't exist.`
              : `The lesson "${lessonId || 'unknown'}" in module "${moduleId || 'unknown'}" doesn't exist.`
            }
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/modules">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Modules
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              Go to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

