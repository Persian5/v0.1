'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, ChevronDown, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { SmartAuthService } from '@/lib/services/smart-auth-service'
import { useXp } from '@/hooks/use-xp'

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  xp: number
  nextUserXp?: number | null
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
  
  // Track XP at page load for "XP gained this visit" feature
  const [initialXp] = useState(userXp)
  const xpGainedThisVisit = userXp - initialXp

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
      
      // Force fresh fetch - bypass browser cache entirely
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        console.error('❌ Leaderboard API error:', response.status, response.statusText)
        throw new Error('Failed to fetch leaderboard')
      }

      const newData: LeaderboardResponse = await response.json()
      
      // Log debug info from API (development only)
      if ((newData as any)._debug) {
        console.log('🔍 API Debug Info:', (newData as any)._debug)
      }
      
      console.log('✅ Leaderboard data received:', {
        userCount: newData.top?.length || 0,
      })

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

  // NOTE: Removed visibilitychange listener per user request
  // Page only refreshes on actual page load/navigation, not tab switching

  const handleLoadMore = () => {
    if (data?.pagination.hasMore) {
      fetchLeaderboard(offset, true)
    }
  }

  // Find current user's entry
  const yourEntry = useMemo(() => {
    if (!user || !data) return null
    return data.top.find(entry => entry.userId === user.id)
  }, [user, data])

  // Get ±3 context around current user (for context card)
  const getContextRanks = useMemo(() => {
    if (!yourEntry || !data) return []
    
    const yourIndex = data.top.findIndex(entry => entry.userId === user?.id)
    if (yourIndex === -1) return []
    
    // Get 3 above and 3 below (or less if at edges)
    const start = Math.max(0, yourIndex - 3)
    const end = Math.min(data.top.length, yourIndex + 4)
    
    return data.top.slice(start, end).map(entry => ({
      ...entry,
      isYou: entry.userId === user?.id
    }))
  }, [yourEntry, data, user])

  // Check if user is in top 3 (don't show context card if they are)
  const userIsInTop3 = yourEntry && yourEntry.rank <= 3

  // Render podium (top 3)
  const renderPodium = () => {
    if (!data || data.top.length === 0) return null

    const top3 = data.top.slice(0, 3)
    const [first, second, third] = top3

    return (
      <div className="mb-8">
        <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-8">
          {/* Second Place */}
          {second && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <Card className={`p-4 sm:p-6 bg-gradient-to-br from-slate-200 to-slate-300 border-slate-400 ${second.userId === user?.id ? 'ring-4 ring-primary shadow-lg' : ''}`}>
                <div className="text-center">
                  <Medal className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 text-slate-500" />
                  <div className="text-3xl sm:text-4xl font-bold mb-1">2</div>
                  <div className="text-sm sm:text-lg font-semibold mb-1 max-w-[100px] sm:max-w-[120px] truncate">
                    {second.displayName}
                    {second.userId === user?.id && <span className="text-primary ml-1">(You)</span>}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{second.xp.toLocaleString()} XP</div>
                </div>
              </Card>
              <div className="h-16 sm:h-24 w-24 sm:w-32 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t-lg -mt-1" />
            </motion.div>
          )}

          {/* First Place - GOLD SHIMMER + GLOW */}
          {first && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <Card 
                className={`p-4 sm:p-6 bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 border-yellow-500 animate-shimmer shadow-[0_0_30px_rgba(255,215,0,0.6)] ${first.userId === user?.id ? 'ring-4 ring-primary' : ''}`}
                style={{
                  backgroundImage: 'linear-gradient(110deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)'
                }}
              >
                <div className="text-center relative">
                  <div className="absolute -top-2 -right-2 animate-pulse-slow">
                    <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
                  </div>
                  <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 text-yellow-600 drop-shadow-lg" />
                  <div className="text-4xl sm:text-5xl font-bold mb-1 text-yellow-900">1</div>
                  <div className="text-base sm:text-xl font-bold mb-1 max-w-[120px] sm:max-w-[140px] truncate text-yellow-900">
                    {first.displayName}
                    {first.userId === user?.id && <span className="text-primary ml-1">(You)</span>}
                  </div>
                  <div className="text-xs sm:text-sm text-yellow-800 font-semibold">{first.xp.toLocaleString()} XP</div>
                </div>
              </Card>
              <div className="h-24 sm:h-32 w-28 sm:w-36 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg -mt-1 shadow-lg" />
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
              <Card className={`p-4 sm:p-6 bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300 ${third.userId === user?.id ? 'ring-4 ring-primary shadow-lg' : ''}`}>
                <div className="text-center">
                  <Medal className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 text-orange-400" />
                  <div className="text-3xl sm:text-4xl font-bold mb-1">3</div>
                  <div className="text-sm sm:text-lg font-semibold mb-1 max-w-[100px] sm:max-w-[120px] truncate">
                    {third.displayName}
                    {third.userId === user?.id && <span className="text-primary ml-1">(You)</span>}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{third.xp.toLocaleString()} XP</div>
                </div>
              </Card>
              <div className="h-14 sm:h-20 w-24 sm:w-32 bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-lg -mt-1" />
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
        <h3 className="text-lg sm:text-xl font-semibold mb-3">Rankings</h3>
        {rest.map((entry, index) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`p-3 sm:p-4 transition-all ${
              entry.userId === user?.id 
                ? 'ring-4 ring-primary bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 animate-pulse-slow shadow-xl scale-[1.02]' 
                : 'hover:bg-accent/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="text-xl sm:text-2xl font-bold text-muted-foreground w-10 sm:w-12 text-center flex-shrink-0">
                    {entry.rank}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {entry.displayName}
                      {entry.userId === user?.id && <span className="text-primary ml-2 font-bold">(You)</span>}
                    </div>
                    {entry.userId === user?.id && entry.nextUserXp && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {entry.nextUserXp - entry.xp} XP to rank {entry.rank - 1}
                      </div>
                    )}
                    {entry.userId === user?.id && xpGainedThisVisit > 0 && (
                      <div className="text-xs text-green-600 font-semibold mt-1">
                        +{xpGainedThisVisit} XP this visit
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-primary text-sm sm:text-base">{entry.xp.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    )
  }

  // Render context card - mobile sticky (above bottom nav)
  const renderMobileContextCard = () => {
    if (!yourEntry || userIsInTop3 || getContextRanks.length === 0) return null

    return (
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 mx-2 sm:mx-4">
        <Card className="bg-background/98 backdrop-blur-md border-primary shadow-2xl">
          <div className="p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-between">
              <span>Your Position</span>
              {yourEntry.nextUserXp && (
                <span className="text-primary">
                  {yourEntry.nextUserXp - yourEntry.xp} XP to next rank
                </span>
              )}
            </p>
            <div className="space-y-1.5">
              {getContextRanks.map(entry => (
                <div 
                  key={entry.rank} 
                  className={`flex justify-between items-center text-sm py-1 px-2 rounded ${
                    entry.isYou 
                      ? 'bg-primary/20 font-bold text-primary border-l-4 border-primary' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <span className="truncate max-w-[180px]">
                    <span className="font-semibold mr-2">#{entry.rank}</span>
                    {entry.displayName}
                  </span>
                  <span className="font-semibold flex-shrink-0">{entry.xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Render context card - desktop sidebar
  const renderDesktopContextCard = () => {
    if (!yourEntry || userIsInTop3 || getContextRanks.length === 0) return null

    return (
      <div className="sticky top-24 h-fit">
        <Card className="border-primary shadow-lg">
          <div className="p-4">
            <h3 className="font-semibold mb-1 text-sm">Your Position</h3>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-primary">#{yourEntry.rank}</span>
              <span className="text-sm text-muted-foreground">{yourEntry.xp.toLocaleString()} XP</span>
            </div>
            
            {yourEntry.nextUserXp && (
              <div className="mb-4 p-2 bg-primary/10 rounded text-sm">
                <p className="text-muted-foreground text-xs mb-1">Next rank</p>
                <p className="font-bold text-primary">
                  {yourEntry.nextUserXp - yourEntry.xp} XP to go
                </p>
              </div>
            )}
            
            {xpGainedThisVisit > 0 && (
              <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <p className="text-green-700 font-semibold">
                  +{xpGainedThisVisit} XP this visit
                </p>
              </div>
            )}
            
            <div className="space-y-2 pt-3 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Nearby Rankings</p>
              {getContextRanks.map(entry => (
                <div 
                  key={entry.rank} 
                  className={`flex justify-between items-center text-sm py-2 px-2 rounded ${
                    entry.isYou 
                      ? 'bg-primary/20 font-bold text-primary border-l-4 border-primary' 
                      : 'text-muted-foreground hover:bg-accent/50'
                  }`}
                >
                  <span className="truncate max-w-[150px]">
                    <span className="font-semibold mr-2">#{entry.rank}</span>
                    {entry.displayName}
                  </span>
                  <span className="font-semibold flex-shrink-0 text-xs">{entry.xp.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No Rankings Yet</h2>
          <p className="text-muted-foreground mb-4">
            {!user 
              ? 'Sign up to compete on the leaderboard!' 
              : userXp === 0 
                ? 'Complete your first lesson to join the rankings!' 
                : 'Be the first to earn XP and claim the top spot!'}
          </p>
          {!user && (
            <Button asChild className="mt-4">
              <Link href="/auth">Sign Up</Link>
            </Button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 md:pb-8">
      <main className="flex-1">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Leaderboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              See how you rank among Persian learners
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Updates in real-time
            </p>
          </div>

          {/* Desktop: Grid Layout with Sidebar */}
          <div className={`${yourEntry && !userIsInTop3 && getContextRanks.length > 0 ? 'hidden md:grid md:grid-cols-[1fr,300px] md:gap-6' : ''}`}>
            <div>
              {/* Podium (Top 3) */}
              {renderPodium()}

              {/* Rest of rankings */}
              {renderList()}

              {/* Load More Button */}
              {data.pagination.hasMore && (
                <div className="text-center mt-6">
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
            </div>
            
            {/* Desktop Context Sidebar */}
            {renderDesktopContextCard()}
          </div>

          {/* Mobile: No Sidebar (use sticky card instead) */}
          <div className={`${yourEntry && !userIsInTop3 && getContextRanks.length > 0 ? 'md:hidden' : ''}`}>
            {/* Podium (Top 3) */}
            {renderPodium()}

            {/* Rest of rankings */}
            {renderList()}

            {/* Load More Button */}
            {data.pagination.hasMore && (
              <div className="text-center mt-6">
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
          </div>
        </div>
      </main>

      {/* Mobile Sticky Context Card (above bottom nav) */}
      {renderMobileContextCard()}

      {/* Footer */}
      <footer className="border-t bg-background py-6 sm:py-8 mt-8">
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
