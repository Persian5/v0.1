'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface LeaderboardEntry {
  rank: number
  displayName: string
  xp: number
  isYou: boolean
}

interface LeaderboardResponse {
  top: LeaderboardEntry[]
  you: LeaderboardEntry | null
  youContext: LeaderboardEntry[]
}

export function LeaderboardWidget() {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/leaderboard?limit=3')
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Leaderboard API error:', response.status, errorText)
          throw new Error(`Failed to fetch leaderboard: ${response.status}`)
        }

        const leaderboardData: LeaderboardResponse = await response.json()
        
        // Validate response structure
        if (!leaderboardData) {
          console.error('Invalid leaderboard response: null or undefined')
          setError('Invalid response format')
          return
        }
        
        if (!leaderboardData.top || !Array.isArray(leaderboardData.top)) {
          console.error('Invalid leaderboard response structure:', leaderboardData)
          setError('Invalid response format')
          return
        }
        
        setData(leaderboardData)
      } catch (err) {
        console.error('Error fetching leaderboard widget:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (isLoading) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data || !data.top || data.top.length === 0) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {error ? 'Failed to load leaderboard' : 'No rankings yet'}
          </p>
          <Link href="/leaderboard">
            <Button variant="outline" size="sm" className="w-full">
              View Leaderboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />
    return null
  }

  return (
    <Card className="bg-white border border-neutral-200/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-4">
          {/* Top 3 */}
          {data.top.map((entry, index) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-2xl border transition-all duration-300 flex items-center hover:bg-gray-50 ${
                entry.isYou 
                  ? 'bg-primary/5 border-primary/20 shadow-sm' 
                  : 'bg-white border-neutral-100 hover:border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                  {getRankIcon(entry.rank) || (
                    <span className="text-lg font-bold text-neutral-400 font-mono">
                      #{entry.rank}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-base text-neutral-900 truncate flex items-center gap-2">
                    {entry.displayName}
                    {entry.isYou && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 pl-4">
                <div className="font-bold text-base text-neutral-900">
                  {entry.xp.toLocaleString()}
                </div>
                <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide">XP</div>
              </div>
            </motion.div>
          ))}

          {/* User rank (if outside top 3) */}
          {data.you && data.you.rank > 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-3 rounded-2xl border border-primary/20 bg-primary/5 shadow-sm mt-6 flex items-center hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                  <span className="text-lg font-bold text-primary font-mono">
                    #{data.you.rank}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-base text-neutral-900 truncate flex items-center gap-2">
                    {data.you.displayName}
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                      You
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 pl-4">
                <div className="font-bold text-base text-neutral-900">
                  {data.you.xp.toLocaleString()}
                </div>
                <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide">XP</div>
              </div>
            </motion.div>
          )}

          {/* View Full Leaderboard Button */}
          <div className="pt-4">
            <Link href="/leaderboard">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-2xl border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600 font-medium transition-all"
              >
                View Full Rankings
                <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

