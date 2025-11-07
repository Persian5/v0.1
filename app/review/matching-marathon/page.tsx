"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ReviewMatchingMarathon } from "@/app/components/review/ReviewMatchingMarathon"
import { ReviewFilterModal } from "@/app/components/review/ReviewFilterModal"
import { ReviewFilter } from "@/lib/services/review-session-service"
import { AuthGuard } from "@/components/auth/AuthGuard"

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic'

function MatchingMarathonContent() {
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
    router.replace(`/review/matching-marathon?filter=${selectedFilter}`, { scroll: false })
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
      <ReviewMatchingMarathon filter={filter} onExit={handleExit} />
    </AuthGuard>
  )
}

export default function MatchingMarathonPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <MatchingMarathonContent />
    </Suspense>
  )
}

