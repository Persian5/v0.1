"use client"

import { useState, useEffect, useCallback } from 'react'
import { getCachedModuleAccess, setCachedModuleAccess } from '@/lib/utils/module-access-cache'

export type ModuleAccessReason = 'no_premium' | 'incomplete_prerequisites' | undefined

export interface ModuleAccessResult {
  canAccess: boolean
  reason: ModuleAccessReason
  requiresPremium: boolean
  hasPremium: boolean
  prerequisitesComplete: boolean
  missingPrerequisites?: string[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Single hook for module/paywall access. Use this in module and lesson pages
 * so all premium checks go through one place and one PremiumLockModal.
 */
export function useModuleAccess(moduleId: string | null, userId: string | null): ModuleAccessResult {
  const [result, setResult] = useState<ModuleAccessResult>({
    canAccess: false,
    reason: undefined,
    requiresPremium: false,
    hasPremium: false,
    prerequisitesComplete: true,
    isLoading: true,
    error: null,
    refetch: async () => {},
  })

  const fetchAccess = useCallback(async () => {
    if (!moduleId || !userId) {
      setResult(prev => ({
        ...prev,
        canAccess: false,
        isLoading: false,
        reason: undefined,
      }))
      return
    }

    setResult(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const cached = getCachedModuleAccess(moduleId, userId)
      if (cached) {
        setResult(prev => ({
          ...prev,
          ...cached,
          isLoading: false,
          refetch: fetchAccess,
        }))
        return
      }

      const res = await fetch(`/api/check-module-access?moduleId=${moduleId}`)
      if (!res.ok) {
        setResult(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to check access',
        }))
        return
      }

      const data = await res.json()
      setCachedModuleAccess(moduleId, userId, data)

      setResult(prev => ({
        ...prev,
        canAccess: data.canAccess,
        reason: data.reason,
        requiresPremium: data.requiresPremium ?? false,
        hasPremium: data.hasPremium ?? false,
        prerequisitesComplete: data.prerequisitesComplete ?? true,
        missingPrerequisites: data.missingPrerequisites,
        isLoading: false,
        error: null,
        refetch: fetchAccess,
      }))
    } catch (err) {
      setResult(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to check access',
      }))
    }
  }, [moduleId, userId])

  useEffect(() => {
    fetchAccess()
  }, [fetchAccess])

  return {
    ...result,
    refetch: fetchAccess,
  }
}
