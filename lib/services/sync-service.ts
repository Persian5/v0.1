import { DatabaseService } from '@/lib/supabase/database'
import { AuthService } from './auth-service'

export interface XpTransaction {
  amount: number
  source: string
  lesson_id?: string
  metadata?: Record<string, any>
  timestamp: number
}

export class SyncService {
  private static pendingXpTransactions: XpTransaction[] = []
  private static syncInterval: NodeJS.Timeout | null = null
  private static isSyncing = false
  private static isOnline = true

  // Start the sync interval lazily (only if not already running)
  private static startSyncInterval(): void {
    if (this.syncInterval || typeof window === 'undefined') return;

    // Set up network listeners once
    this.setupNetworkListeners();

    this.syncInterval = setInterval(() => {
      if (this.pendingXpTransactions.length === 0) {
        // Nothing left to sync – stop interval to avoid idle calls
        this.stopSyncInterval();
        return;
      }
      this.syncPendingTransactions();
    }, 5000);
  }

  // Stop interval helper
  private static stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Add XP transaction to queue (for real-time UI updates)
  static queueXpTransaction(transaction: Omit<XpTransaction, 'timestamp'>): void {
    const timestampedTransaction: XpTransaction = {
      ...transaction,
      timestamp: Date.now()
    }
    
    this.pendingXpTransactions.push(timestampedTransaction)
    
    // Ensure interval is running
    this.startSyncInterval();

    // Try immediate sync if we're online and not currently syncing
    if (this.isOnline && !this.isSyncing) {
      this.syncPendingTransactions();
    }
  }

  // Sync pending transactions to Supabase
  private static async syncPendingTransactions(): Promise<void> {
    if (this.isSyncing || this.pendingXpTransactions.length === 0) {
      return
    }

    const currentUser = await AuthService.getCurrentUser()
    if (!currentUser) {
      // User not authenticated, keep transactions in queue
      return
    }

    const isVerified = await AuthService.isEmailVerified(currentUser)
    if (!isVerified) {
      // Email not verified, keep transactions in queue
      return
    }

    this.isSyncing = true

    try {
      // Get transactions to sync
      const transactionsToSync = [...this.pendingXpTransactions]
      
      if (transactionsToSync.length === 0) {
        this.isSyncing = false
        return
      }

      // Prepare transactions for database
      const dbTransactions = transactionsToSync.map(t => {
        // Clean metadata by removing undefined values
        const cleanMeta: Record<string, any> | null = t.metadata
          ? Object.fromEntries(Object.entries(t.metadata).filter(([, v]) => v !== undefined))
          : null

        return {
          amount: t.amount,
          source: t.source,
          lesson_id: t.lesson_id || null,
          metadata: cleanMeta
        }
      })

      // Sync to database
      await DatabaseService.batchUpdateUserXp(currentUser.id, dbTransactions)
      
      // Remove synced transactions from queue
      this.pendingXpTransactions = this.pendingXpTransactions.filter(
        t => !transactionsToSync.some(synced => 
          synced.timestamp === t.timestamp && synced.amount === t.amount
        )
      )

      console.log(`Synced ${transactionsToSync.length} XP transactions to Supabase`);

      // If queue is empty after successful sync, stop interval to reduce idle traffic
      if (this.pendingXpTransactions.length === 0) {
        this.stopSyncInterval();
      }
      
    } catch (error) {
      console.error('Failed to sync XP transactions:', error)
      // Keep transactions in queue for retry
    } finally {
      this.isSyncing = false
    }
  }

  // Setup network listeners for online/offline detection
  private static setupNetworkListeners(): void {
    if (typeof window === 'undefined') return

    const updateOnlineStatus = () => {
      this.isOnline = navigator.onLine
      
      if (this.isOnline && this.pendingXpTransactions.length > 0) {
        // We're back online, try to sync pending transactions
        this.syncPendingTransactions()
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Set initial status
    this.isOnline = navigator.onLine
  }

  // Load pending transactions from localStorage on startup (for recovery)
  static loadPendingTransactionsFromStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('pending-xp-transactions')
      if (stored) {
        this.pendingXpTransactions = JSON.parse(stored)
        // Clear localStorage after loading to prevent accumulation
        localStorage.removeItem('pending-xp-transactions')
      }
    } catch (error) {
      console.warn('Failed to load pending transactions from localStorage:', error)
      this.pendingXpTransactions = []
    }
  }

  // Get current queue status (for debugging)
  static getQueueStatus(): {
    pendingCount: number
    isSyncing: boolean
    isOnline: boolean
  } {
    return {
      pendingCount: this.pendingXpTransactions.length,
      isSyncing: this.isSyncing,
      isOnline: this.isOnline
    }
  }

  // Force sync immediately (useful for testing or critical moments)
  static async forceSyncNow(): Promise<boolean> {
    if (this.isSyncing) {
      return false
    }

    try {
      await this.syncPendingTransactions()
      return true
    } catch (error) {
      console.error('Force sync failed:', error)
      return false
    }
  }

  // Clear all pending transactions (use with caution)
  static clearPendingTransactions(): void {
    this.pendingXpTransactions = []
  }

  // Public helper to forcefully stop (e.g., on sign-out)
  static stopSync(): void {
    this.stopSyncInterval();
  }

  // Expose a start method (used at login) – will only create interval if needed
  static startSync(): void {
    // If running in SSR, noop
    if (typeof window === 'undefined') return;

    // If there is already work pending start interval, else wait for first transaction
    if (this.pendingXpTransactions.length > 0) {
      this.startSyncInterval();
    }
  }
} 