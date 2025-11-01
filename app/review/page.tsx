"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Review Mode Page
 * Redirects to /practice for now (Phase 5 will implement full review mode)
 */
export default function ReviewPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to practice page (review mode will be implemented in Phase 5)
    router.replace('/practice')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

