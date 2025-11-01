"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ReviewFilter } from "@/lib/services/review-session-service"

/**
 * Hook for managing review filter state and URL synchronization
 * 
 * Features:
 * - Reads filter from URL search params (?filter=all-learned)
 * - Updates URL when filter changes
 * - Provides current filter value
 * - Handles filter selection callback
 */
export function useReviewFilter(): {
  filter: ReviewFilter
  setFilter: (filter: ReviewFilter) => void
  isFilterValid: boolean
} {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get filter from URL, default to 'all-learned'
  const urlFilter = searchParams.get('filter') as ReviewFilter | null
  const [filter, setFilterState] = useState<ReviewFilter>(
    urlFilter && ['all-learned', 'mastered', 'hard-words'].includes(urlFilter)
      ? urlFilter
      : 'all-learned'
  )

  // Validate filter from URL
  const isFilterValid = urlFilter 
    ? ['all-learned', 'mastered', 'hard-words'].includes(urlFilter)
    : true // Default is valid

  // Sync state with URL when URL changes (e.g., browser back/forward)
  useEffect(() => {
    if (urlFilter && ['all-learned', 'mastered', 'hard-words'].includes(urlFilter)) {
      setFilterState(urlFilter)
    } else if (!urlFilter) {
      // If no filter in URL, set default
      setFilterState('all-learned')
    }
  }, [urlFilter])

  // Update filter and URL
  const setFilter = useCallback((newFilter: ReviewFilter) => {
    setFilterState(newFilter)
    
    // Update URL without page reload
    const params = new URLSearchParams(searchParams.toString())
    params.set('filter', newFilter)
    
    // Use replace to avoid adding to history (cleaner UX)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  return {
    filter,
    setFilter,
    isFilterValid
  }
}

