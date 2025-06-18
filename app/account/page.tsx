"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, User, Trophy, Target } from "lucide-react"
import { useXp } from "@/hooks/use-xp"
import { XpService } from "@/lib/services/xp-service"

export default function AccountPage() {
  const [mounted, setMounted] = useState(false)
  const { xp } = useXp({
    storageKey: 'global-user-xp'
  });

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-3 sm:px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg text-primary">
            Home
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                Pricing + FAQ
              </Button>
            </Link>
            <Link href="/modules">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white">
                Start Learning
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-3 mb-4">
              <User className="h-8 w-8 text-primary" />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
                Your Account
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Track your Persian learning progress
            </p>
          </div>

          {/* XP Card */}
          <Card className="mb-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Star className="h-6 w-6 text-yellow-500" />
                Total Experience Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold text-accent mb-4">
                  {XpService.formatXp(xp)}
                </div>
                <p className="text-muted-foreground text-lg">
                  Keep learning to earn more XP!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Learning Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Learning Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Lessons Completed</span>
                    <span className="font-semibold">
                      {xp > 0 ? Math.floor(xp / 10) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Streak</span>
                    <span className="font-semibold">
                      {xp > 20 ? "🔥 Active" : "Start learning!"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Learning Level</span>
                    <span className="font-semibold">
                      {xp < 50 ? "Beginner" : xp < 200 ? "Intermediate" : "Advanced"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Learning Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Next Milestone</span>
                    <span className="font-semibold">
                      {xp < 100 ? "100 XP" : xp < 500 ? "500 XP" : "1000 XP"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">
                      {xp < 100 ? `${xp}/100` : xp < 500 ? `${xp}/500` : `${xp}/1000`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min(100, xp < 100 ? (xp / 100) * 100 : xp < 500 ? (xp / 500) * 100 : (xp / 1000) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/modules" className="flex-1">
                  <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                    Continue Learning
                  </Button>
                </Link>
                <Link href="/modules/module1/lesson1" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Practice Lesson 1
                  </Button>
                </Link>
                <Link href="/pricing" className="flex-1">
                  <Button variant="outline" className="w-full">
                    FAQ
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 