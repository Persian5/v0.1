/**
 * Dashboard Animation Permission Hook
 * Controls when scroll-triggered animations should run
 * Prevents animation spam while keeping them fresh
 */

import { useState, useEffect } from 'react'

const ANIMATION_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes
const STORAGE_KEY = 'dashboardAnimationTimestamp'

interface AnimationPermission {
  shouldAnimate: boolean
  markAnimated: () => void
}

/**
 * Hook to control dashboard animation triggers
 * Animations run on first load, then have a 5-minute cooldown
 * 
 * @returns shouldAnimate - Whether animations should run this session
 * @returns markAnimated - Function to mark animations as triggered
 */
export function useDashboardAnimations(): AnimationPermission {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    try {
      const lastAnimationTime = localStorage.getItem(STORAGE_KEY)
      const now = Date.now()

      if (!lastAnimationTime) {
        // First visit - animate
        setShouldAnimate(true)
        return
      }

      const timeSinceLastAnimation = now - parseInt(lastAnimationTime, 10)

      if (timeSinceLastAnimation > ANIMATION_COOLDOWN_MS) {
        // Cooldown expired - animate again
        setShouldAnimate(true)
      } else {
        // Still in cooldown - skip animations
        setShouldAnimate(false)
      }
    } catch (error) {
      // LocalStorage unavailable - default to animating
      console.warn('Dashboard animations: localStorage unavailable', error)
      setShouldAnimate(true)
    }
  }, [])

  const markAnimated = () => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    } catch (error) {
      console.warn('Dashboard animations: failed to mark timestamp', error)
    }
  }

  return {
    shouldAnimate,
    markAnimated
  }
}

