"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { PersianWordRush } from "@/app/components/games/PersianWordRush"
import { useRouter, useSearchParams } from "next/navigation"
import { ReviewFilterModal } from "@/app/components/review/ReviewFilterModal"
import { ReviewFilter } from "@/lib/services/review-session-service"
import { AuthGuard } from "@/components/auth/AuthGuard"
import GameErrorBoundary from "@/components/errors/GameErrorBoundary"

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic'

function WordRushContent() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<ReviewFilter | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Prevent scrolling on the page (only in browser)
    if (typeof window !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      // Restore scrolling when leaving the page
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'auto'
      }
    }
  }, [])

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
    router.replace(`/review/word-rush?filter=${selectedFilter}`, { scroll: false })
  }

  const handleExit = () => {
    router.push('/review')
  }

  if (!mounted) {
    return null
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

  return (
    <AuthGuard>
      <div className="flex h-screen flex-col bg-background overflow-hidden">
        {/* Game Container */}
        <main className="flex-1 overflow-hidden">
          {filter && <PersianWordRush filter={filter} onExit={handleExit} />}
        </main>
      </div>
    </AuthGuard>
  )
}

export default function WordRushPage() {
  return (
    <GameErrorBoundary>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <WordRushContent />
      </Suspense>
    </GameErrorBoundary>
  )
} 