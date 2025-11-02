"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ReviewMemoryGame } from "@/app/components/review/ReviewMemoryGame"
import { ReviewFilterModal } from "@/app/components/review/ReviewFilterModal"
import { ReviewFilter } from "@/lib/services/review-session-service"
import { AuthGuard } from "@/components/auth/AuthGuard"

function MemoryGameContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<ReviewFilter | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)

  useEffect(() => {
    // Get filter from URL
    const urlFilter = searchParams.get('filter') as ReviewFilter | null
    
    if (urlFilter && ['all-learned', 'mastered', 'hard-words'].includes(urlFilter)) {
      setFilter(urlFilter)
    } else {
      // No filter in URL - show modal
      setShowFilterModal(true)
    }
  }, [searchParams])

  const handleFilterSelect = (selectedFilter: ReviewFilter) => {
    setFilter(selectedFilter)
    setShowFilterModal(false)
    // Update URL
    router.replace(`/review/memory-game?filter=${selectedFilter}`, { scroll: false })
  }

  const handleExit = () => {
    router.push('/review')
  }

  if (showFilterModal) {
    return (
      <AuthGuard>
        <ReviewFilterModal
          isOpen={showFilterModal}
          onClose={() => router.push('/review')}
          onFilterSelect={handleFilterSelect}
        />
      </AuthGuard>
    )
  }

  if (!filter) {
    return null // Still loading filter
  }

  return (
    <AuthGuard>
      <ReviewMemoryGame filter={filter} onExit={handleExit} />
    </AuthGuard>
  )
}

export default function MemoryGamePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F3]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent mx-auto mb-4" />
          <p className="text-[#1E293B]">Loading...</p>
        </div>
      </div>
    }>
      <MemoryGameContent />
    </Suspense>
  )
}

