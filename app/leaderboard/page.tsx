'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, ChevronDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { useXp } from '@/hooks/use-xp'
import { DatabaseService } from '@/lib/supabase/database'

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  xp: number
  isYou?: boolean
}

interface LeaderboardResponse {
  top: LeaderboardEntry[]
  you: LeaderboardEntry | null
  youContext: LeaderboardEntry[]
  pagination: {
    limit: number
    offset: number
    nextOffset: number
    hasMore: boolean
  }
}

export default function LeaderboardPage() {
  const { user } = useAuth() // Get current user
  const { xp: userXp } = useXp() // Get user's actual XP from cache
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasRecalculated, setHasRecalculated] = useState(false) // Prevent infinite loop

  // Fetch leaderboard data
  const fetchLeaderboard = async (newOffset: number = 0, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)

      const apiUrl = `/api/leaderboard?limit=10&offset=${newOffset}`
      console.log('🔍 Fetching leaderboard:', apiUrl)
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        console.error('❌ Leaderboard API error:', response.status, response.statusText)
        throw new Error('Failed to fetch leaderboard')
      }

      const newData: LeaderboardResponse = await response.json()
      
      // Detailed logging with XP values to identify stale data
      const usersWithXp = newData.top?.map(u => ({ 
        name: u.displayName, 
        xp: u.xp, 
        rank: u.rank,
        userId: u.userId 
      })) || []
      
      console.log('✅ Leaderboard data received:', {
        userCount: newData.top?.length || 0,
        users: usersWithXp
      })
      
      // Check if current user's XP matches what they see in header
      if (user && newData.top) {
        const currentUserEntry = newData.top.find(u => u.userId === user.id)
        if (currentUserEntry) {
          const xpMismatch = userXp !== currentUserEntry.xp
          console.log('👤 Your leaderboard entry:', {
            name: currentUserEntry.displayName,
            leaderboardXp: currentUserEntry.xp,
            yourActualXp: userXp,
            rank: currentUserEntry.rank,
            mismatch: xpMismatch ? `⚠️ MISMATCH: Leaderboard shows ${currentUserEntry.xp} but you have ${userXp}` : '✅ Match'
          })
          
          if (xpMismatch && !hasRecalculated) {
            console.warn('⚠️ XP MISMATCH DETECTED:', {
              yourCacheXp: userXp,
              leaderboardDbXp: currentUserEntry.xp,
              difference: userXp - currentUserEntry.xp,
              issue: 'Database has stale XP - RPC might not be updating user_profiles.total_xp'
            })
            
            // Only recalculate once per page load to prevent infinite loop
            setHasRecalculated(true)
            console.log('🔧 Attempting to fix XP mismatch by recalculating from transactions...')
            DatabaseService.recalculateUserXpFromTransactions(user.id)
              .then(newXp => {
                console.log('✅ XP recalculated:', { oldXp: currentUserEntry.xp, newXp })
                console.log('ℹ️ Please refresh the page to see updated leaderboard')
                // Don't auto-refresh - let user manually refresh to avoid infinite loop
              })
              .catch(error => {
                console.error('❌ Failed to recalculate XP:', error)
                setHasRecalculated(false) // Allow retry on error
              })
          } else if (xpMismatch && hasRecalculated) {
            console.log('ℹ️ XP mismatch still exists after recalculation. Please refresh the page.')
          }
        } else {
          console.log('ℹ️ You are not in the top leaderboard entries')
        }
      }

      if (append && data) {
        // Append new data to existing
        setData({
          ...newData,
          top: [...data.top, ...newData.top]
        })
      } else {
        setData(newData)
      }

      setOffset(newData.pagination.nextOffset)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError('Failed to load leaderboard. Please try again.')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Sync XP from database on page load to ensure leaderboard shows accurate data
  useEffect(() => {
    if (user) {
      // Force refresh XP from database to sync cache with actual DB value
      // This ensures leaderboard shows correct XP even if cache was out of sync
      SmartAuthService.refreshXpFromDb().catch(err => {
        console.warn('Failed to refresh XP from DB (non-critical):', err)
      })
    }
  }, [user])

  // Initial load
  useEffect(() => {
    fetchLeaderboard(0, false)
  }, [])

  // Refresh on page visibility (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLeaderboard(0, false)
        setOffset(0)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleLoadMore = () => {
    if (data?.pagination.hasMore) {
      fetchLeaderboard(offset, true)
    }
  }

  // Render podium (top 3)
  const renderPodium = () => {
    if (!data || data.top.length === 0) return null

    const top3 = data.top.slice(0, 3)
    const [first, second, third] = top3

    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-8 text-primary">
          <Trophy className="inline-block w-8 h-8 mr-2 text-yellow-500" />
          Top 3
        </h2>
        
        <div className="flex items-end justify-center gap-4 md:gap-8">
          {/* Second Place */}
          {second && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <Card className={`p-6 bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 ${second.userId === user?.id ? 'ring-4 ring-primary shadow-lg' : ''}`}>
                <div className="text-center">
                  <Medal className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                  <div className="text-4xl font-bold mb-1">2</div>
                  <div className="text-lg font-semibold mb-1 max-w-[120px] truncate">
                    {second.displayName}
                    {second.userId === user?.id && <span className="text-primary ml-1">(You)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">{second.xp.toLocaleString()} XP</div>
                </div>
              </Card>
              <div className="h-24 w-32 bg-gradient-to-t from-slate-300 to-slate-200 rounded-t-lg -mt-1" />
            </motion.div>
          )}

          {/* First Place */}
          {first && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <Card className={`p-6 bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-400 ${first.userId === user?.id ? 'ring-4 ring-primary shadow-lg' : ''}`}>
                <div className="text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-2 text-yellow-500" />
                  <div className="text-5xl font-bold mb-1">1</div>
                  <div className="text-xl font-bold mb-1 max-w-[140px] truncate">
                    {first.displayName}
                    {first.userId === user?.id && <span className="text-primary ml-1">(You)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">{first.xp.toLocaleString()} XP</div>
                </div>
              </Card>
              <div className="h-32 w-36 bg-gradient-to-t from-yellow-300 to-yellow-200 rounded-t-lg -mt-1" />
            </motion.div>
          )}

          {/* Third Place */}
          {third && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <Card className={`p-6 bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300 ${third.userId === user?.id ? 'ring-4 ring-primary shadow-lg' : ''}`}>
                <div className="text-center">
                  <Medal className="w-12 h-12 mx-auto mb-2 text-orange-400" />
                  <div className="text-4xl font-bold mb-1">3</div>
                  <div className="text-lg font-semibold mb-1 max-w-[120px] truncate">
                    {third.displayName}
                    {third.userId === user?.id && <span className="text-primary ml-1">(You)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">{third.xp.toLocaleString()} XP</div>
                </div>
              </Card>
              <div className="h-20 w-32 bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-lg -mt-1" />
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  // Render list (ranks 4+)
  const renderList = () => {
    if (!data || data.top.length <= 3) return null

    const rest = data.top.slice(3)

    return (
      <div className="space-y-2">
        <h3 className="text-xl font-semibold mb-4">Rankings</h3>
        {rest.map((entry, index) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`p-4 hover:bg-accent/50 transition-colors ${entry.userId === user?.id ? 'ring-4 ring-primary bg-primary/10 shadow-lg' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-muted-foreground w-12 text-center">
                    {entry.rank}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {entry.displayName}
                      {entry.userId === user?.id && <span className="text-primary ml-2 font-bold">(You)</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{entry.xp.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    )
  }

  // Render "You are here" section (if outside top 10)
  const renderYouSection = () => {
    if (!data?.you || data.you.rank <= 10 || data.youContext.length === 0) return null

    return (
      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-4">You are here</h3>
        <div className="space-y-2">
          {data.youContext.map((entry) => (
            <Card
              key={entry.rank}
              className={`p-4 ${entry.isYou ? 'ring-2 ring-primary bg-primary/10' : 'bg-background/50'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-muted-foreground w-12 text-center">
                    {entry.rank}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {entry.displayName}
                      {entry.isYou && <span className="text-primary ml-2">(You)</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{entry.xp.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-8 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchLeaderboard(0, false)}>
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  if (!data || data.top.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No Rankings Yet</h2>
          <p className="text-muted-foreground">
            Be the first to earn XP and claim the top spot!
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you rank among Persian learners
        </p>
      </div>

      {/* Podium (Top 3) */}
      {renderPodium()}

      {/* Rest of rankings */}
      {renderList()}

      {/* Load More Button */}
      {data.pagination.hasMore && (
        <div className="text-center mt-8">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            size="lg"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Load More
              </>
            )}
          </Button>
        </div>
      )}

      {/* You are here section */}
      {renderYouSection()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Persian Learning Platform. Made with{' '}
              <span className="text-red-500">❤️</span> for the diaspora.
            </p>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-primary">
                Home
              </Link>
              <Link href="/modules" className="text-muted-foreground hover:text-primary">
                Modules
              </Link>
              <Link href="/dashboard" className="text-muted-foreground hover:text-primary">
                Dashboard
              </Link>
              <Link href="/review" className="text-muted-foreground hover:text-primary">
                Review Mode
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

