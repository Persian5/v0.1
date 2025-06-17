import { useState, useEffect, useCallback } from 'react'

// XP Configuration - easily extensible for different XP types
export interface XpConfig {
  storageKey: string
  defaultValue: number
  maxValue?: number
  minValue?: number
}

// Default XP configuration
const DEFAULT_XP_CONFIG: XpConfig = {
  storageKey: 'user-xp',
  defaultValue: 0,
  maxValue: 999999,
  minValue: 0,
}

// XP transaction types for future analytics/history
export interface XpTransaction {
  amount: number
  source: string
  timestamp: number
  lessonId?: string
  moduleId?: string
  activityType?: 'flashcard' | 'quiz' | 'input' | 'matching' | 'final' | 'bonus'
}

// Hook return interface
export interface UseXpReturn {
  xp: number
  addXp: (amount: number, source: string, metadata?: Partial<XpTransaction>) => void
  setXp: (value: number) => void
  resetXp: () => void
  isLoading: boolean
  lastTransaction: XpTransaction | null
}

/**
 * Custom hook for managing user XP with localStorage persistence
 * Fully modular and scalable for future features
 */
export function useXp(config: Partial<XpConfig> = {}): UseXpReturn {
  const xpConfig = { ...DEFAULT_XP_CONFIG, ...config }
  
  const [xp, setXpState] = useState<number>(xpConfig.defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [lastTransaction, setLastTransaction] = useState<XpTransaction | null>(null)

  // Load XP from localStorage on mount
  useEffect(() => {
    const loadXpFromStorage = () => {
      try {
        const storedXp = localStorage.getItem(xpConfig.storageKey)
        if (storedXp !== null) {
          const parsedXp = parseInt(storedXp, 10)
          if (!isNaN(parsedXp)) {
            setXpState(Math.max(xpConfig.minValue!, Math.min(xpConfig.maxValue!, parsedXp)))
          }
        }
      } catch (error) {
        console.warn('Failed to load XP from localStorage:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Load immediately if we're in the browser
    if (typeof window !== 'undefined') {
      loadXpFromStorage()
    } else {
      setIsLoading(false)
    }
  }, [xpConfig.storageKey, xpConfig.minValue, xpConfig.maxValue])

  // Save XP to localStorage whenever it changes
  const saveXpToStorage = useCallback((newXp: number) => {
    try {
      localStorage.setItem(xpConfig.storageKey, newXp.toString())
    } catch (error) {
      console.warn('Failed to save XP to localStorage:', error)
    }
  }, [xpConfig.storageKey])

  // Add XP with validation and persistence
  const addXp = useCallback((
    amount: number, 
    source: string, 
    metadata: Partial<XpTransaction> = {}
  ) => {
    if (isLoading) return

    const transaction: XpTransaction = {
      amount,
      source,
      timestamp: Date.now(),
      ...metadata,
    }

    setXpState(currentXp => {
      const newXp = Math.max(
        xpConfig.minValue!,
        Math.min(xpConfig.maxValue!, currentXp + amount)
      )
      
      // Save to localStorage
      saveXpToStorage(newXp)
      
      // Store transaction for potential future use
      setLastTransaction(transaction)
      
      // Optional: Save transaction history (for future analytics)
      try {
        const historyKey = `${xpConfig.storageKey}-history`
        const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]')
        const updatedHistory = [...existingHistory, transaction].slice(-100) // Keep last 100 transactions
        localStorage.setItem(historyKey, JSON.stringify(updatedHistory))
      } catch (error) {
        console.warn('Failed to save XP transaction history:', error)
      }

      return newXp
    })
  }, [isLoading, xpConfig.minValue, xpConfig.maxValue, saveXpToStorage])

  // Set XP directly with validation and persistence
  const setXp = useCallback((value: number) => {
    if (isLoading) return

    const newXp = Math.max(
      xpConfig.minValue!,
      Math.min(xpConfig.maxValue!, value)
    )
    
    setXpState(newXp)
    saveXpToStorage(newXp)
  }, [isLoading, xpConfig.minValue, xpConfig.maxValue, saveXpToStorage])

  // Reset XP to default value
  const resetXp = useCallback(() => {
    setXpState(xpConfig.defaultValue)
    saveXpToStorage(xpConfig.defaultValue)
    setLastTransaction(null)
    
    // Clear transaction history
    try {
      localStorage.removeItem(`${xpConfig.storageKey}-history`)
    } catch (error) {
      console.warn('Failed to clear XP transaction history:', error)
    }
  }, [xpConfig.defaultValue, saveXpToStorage, xpConfig.storageKey])

  return {
    xp,
    addXp,
    setXp,
    resetXp,
    isLoading,
    lastTransaction,
  }
} 