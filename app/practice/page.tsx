"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AccountNavButton } from "@/app/components/AccountNavButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Trophy, Target } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PracticePage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Game modes available in Practice section
  const gameModes = [
    {
      id: "word-rush",
      title: "Persian Word Rush",
      description: "Fast-paced vocabulary matching with increasing speed",
      icon: <Zap className="h-6 w-6" />,
      href: "/practice/word-rush",
      available: true,
      difficulty: "Easy → Hard",
      features: ["Sliding words", "4 lives system", "XP combos", "Module 1 vocab"]
    },
    {
      id: "story-mode",
      title: "Story Mode",
      description: "Character driven cultural game mode where you get to experience different Persian events and have to talk with people",
      icon: <Target className="h-6 w-6" />,
      href: "#",
      available: false,
      difficulty: "Medium",
      features: ["Cultural immersion", "Story-driven", "Character conversations", "Persian events"]
    },
    {
      id: "pronunciation-check",
      title: "Pronunciation Check",
      description: "Testing a user's pronunciation of words",
      icon: <Trophy className="h-6 w-6" />,
      href: "#",
      available: false,
      difficulty: "Medium → Hard",
      features: ["Voice recognition", "Pronunciation feedback", "Practice sessions", "Progress tracking"]
    }
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            Home
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/modules">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                Modules
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                Pricing + FAQ
              </Button>
            </Link>
            <AccountNavButton />
          </div>
        </div>
      </header>

      <main className="flex-1 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Page Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-primary mb-4">
              Practice Games
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Master your Persian skills with endless, engaging practice games
            </p>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {gameModes.map((game) => (
              <Card 
                key={game.id} 
                className={`relative transition-all duration-300 hover:shadow-lg border-2 bg-white ${
                  game.available 
                    ? 'hover:border-accent/50 hover:scale-105 cursor-pointer' 
                    : 'opacity-60 border-gray-200'
                }`}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                      {game.title}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      {game.icon}
                      <span className="font-medium">{game.difficulty}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-4 text-center min-h-[40px] flex items-center justify-center">
                    {game.description}
                  </p>
                  
                  {/* Features List */}
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center">
                      Features
                    </h4>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {game.features.map((feature, index) => (
                        <span 
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="w-full">
                    {game.available ? (
                      <Link href={game.href} className="block">
                        <Button className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 rounded-lg transition-colors">
                          Play Now
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full bg-gray-100 text-gray-500 cursor-not-allowed font-semibold py-3 rounded-lg"
                        disabled
                      >
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Section */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm border">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Practice anytime after completing lessons</span>
              <div className="w-3 h-3 rounded-full bg-yellow-500 ml-4"></div>
              <span className="text-sm text-gray-600">More games coming soon</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              © 2025 Iranopedia. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Home
              </Link>
              <Link href="/modules" className="text-sm text-gray-500 hover:text-gray-700">
                Modules
              </Link>
              <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-700">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 