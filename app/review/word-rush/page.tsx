"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { PersianWordRush } from "@/app/components/games/PersianWordRush"
import { AccountNavButton } from "@/app/components/AccountNavButton"
import { useRouter, useSearchParams } from "next/navigation"
import { ReviewFilterModal } from "@/app/components/review/ReviewFilterModal"
import { ReviewFilter } from "@/lib/services/review-session-service"
import { AuthGuard } from "@/components/auth/AuthGuard"

export default function WordRushPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<ReviewFilter | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Prevent scrolling on the page
    document.body.style.overflow = 'hidden'
    
    return () => {
      // Restore scrolling when leaving the page
      document.body.style.overflow = 'auto'
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
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Link href="/review">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Review
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/modules">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  Modules
                </Button>
              </Link>
              <AccountNavButton />
            </div>
          </div>
        </header>

        {/* Game Container */}
        <main className="flex-1 overflow-hidden">
          {filter && <PersianWordRush filter={filter} onExit={handleExit} />}
        </main>
      </div>
    </AuthGuard>
  )
} 