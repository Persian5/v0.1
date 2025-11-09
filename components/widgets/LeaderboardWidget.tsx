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
          throw new Error('Failed to fetch leaderboard')
        }

        const leaderboardData: LeaderboardResponse = await response.json()
        setData(leaderboardData)
      } catch (err) {
        console.error('Error fetching leaderboard widget:', err)
        setError('Failed to load')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-background via-primary/5 to-background">
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

  if (error || !data || data.top.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-background via-primary/5 to-background">
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
    <Card className="bg-gradient-to-br from-background via-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Top 3 */}
        {data.top.map((entry, index) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg border ${
              entry.isYou 
                ? 'bg-primary/10 border-primary' 
                : 'bg-background/50 border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(entry.rank) || (
                    <span className="text-lg font-bold text-muted-foreground">
                      {entry.rank}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {entry.displayName}
                    {entry.isYou && (
                      <span className="text-primary ml-1 text-xs">(You)</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-sm text-primary">
                  {entry.xp.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">XP</div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* User rank (if outside top 3) */}
        {data.you && data.you.rank > 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-3 rounded-lg border bg-primary/10 border-primary mt-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                  <span className="text-lg font-bold text-primary">
                    {data.you.rank}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {data.you.displayName}
                    <span className="text-primary ml-1 text-xs">(You)</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-sm text-primary">
                  {data.you.xp.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">XP</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* View Full Leaderboard Button */}
        <Link href="/leaderboard">
          <Button variant="outline" size="sm" className="w-full mt-4">
            View Your Ranking
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

