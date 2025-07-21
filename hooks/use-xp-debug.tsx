import { useEffect, useState } from 'react'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { XpService } from '@/lib/services/xp-service'
import { useXp } from './use-xp'

interface XpDebugInfo {
  contextXp: number
  cachedXp: number
  isInSync: boolean
  lastEvent: string | null
  debugState: ReturnType<typeof SmartAuthService.getDebugState>
  syncStatus: {
    pendingCount: number
    isSyncing: boolean
    isOnline: boolean
  }
}

/**
 * Debug hook for monitoring XP system in development
 * Use this to verify that reactive updates are working correctly
 */
export function useXpDebug(): XpDebugInfo {
  const { xp: contextXp } = useXp()
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const [debugState, setDebugState] = useState(SmartAuthService.getDebugState())
  const [syncStatus, setSyncStatus] = useState({ pendingCount: 0, isSyncing: false, isOnline: true })

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const unsubscribe = SmartAuthService.addEventListener((eventType, data) => {
      setLastEvent(`${eventType}: ${JSON.stringify(data).substring(0, 100)}`)
      setDebugState(SmartAuthService.getDebugState())
    })

    // Update debug state and sync status periodically
    const interval = setInterval(() => {
      setDebugState(SmartAuthService.getDebugState())
      setSyncStatus(XpService.getSyncStatus())
    }, 1000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const cachedXp = SmartAuthService.getUserXp()

  return {
    contextXp,
    cachedXp,
    isInSync: contextXp === cachedXp,
    lastEvent,
    debugState,
    syncStatus
  }
}

/**
 * Debug component for displaying XP system status
 * Add this to your lesson page during development
 */
export function XpDebugPanel() {
  const debug = useXpDebug()
  const [validationResult, setValidationResult] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)

  if (process.env.NODE_ENV !== 'development') return null

  const handleValidateSync = async () => {
    setIsValidating(true)
    try {
      const result = await SmartAuthService.validateXpSync()
      setValidationResult(result)
    } catch (error) {
      setValidationResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">XP Debug Panel</h3>
      <div className="space-y-1">
        <div>Context XP: {debug.contextXp}</div>
        <div>Cached XP: {debug.cachedXp}</div>
        <div className={debug.isInSync ? 'text-green-400' : 'text-red-400'}>
          In Sync: {debug.isInSync ? '✓' : '✗'}
        </div>
        <div>Listeners: {debug.debugState.listeners}</div>
        <div>Has Session: {debug.debugState.hasSession ? '✓' : '✗'}</div>
        <div className="border-t border-gray-600 pt-1 mt-2">
          <div className="text-yellow-400 font-semibold">Sync Status:</div>
          <div>Pending: {debug.syncStatus.pendingCount}</div>
          <div className={debug.syncStatus.isSyncing ? 'text-blue-400' : 'text-gray-400'}>
            Syncing: {debug.syncStatus.isSyncing ? '⏳' : '⏸️'}
          </div>
          <div className={debug.syncStatus.isOnline ? 'text-green-400' : 'text-red-400'}>
            Online: {debug.syncStatus.isOnline ? '✓' : '✗'}
          </div>
        </div>
        {validationResult && (
          <div className="border-t border-gray-600 pt-1 mt-2">
            <div className="text-purple-400 font-semibold">DB Validation:</div>
            {validationResult.error ? (
              <div className="text-red-400">Error: {validationResult.error}</div>
            ) : (
              <>
                <div>DB XP: {validationResult.databaseXp}</div>
                <div className={validationResult.isValid ? 'text-green-400' : 'text-red-400'}>
                  Valid: {validationResult.isValid ? '✓' : '✗'}
                </div>
                {!validationResult.isValid && (
                  <div className="text-red-400">Diff: {validationResult.difference}</div>
                )}
              </>
            )}
          </div>
        )}
        <div className="border-t border-gray-600 pt-1 mt-2">
          <div className="text-xs text-gray-300">Last Event:</div>
          <div className="text-xs text-gray-400">{debug.lastEvent || 'None'}</div>
        </div>
        <div className="space-y-1 mt-2">
          <button 
            onClick={() => SmartAuthService.forceSyncNow()}
            className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
          >
            Force Sync Now
          </button>
          <button 
            onClick={handleValidateSync}
            disabled={isValidating}
            className="w-full px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-xs"
          >
            {isValidating ? 'Validating...' : 'Validate DB Sync'}
          </button>
        </div>
      </div>
    </div>
  )
} 