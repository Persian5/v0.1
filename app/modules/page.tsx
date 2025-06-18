"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { getModules } from "@/lib/config/curriculum"

// Generate static params for modules page (empty array means this route is always available)
export async function generateStaticParams() {
  return []
}

export default function ModulesPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const modules = getModules().map((module, index) => ({
    id: index + 1, // Use numeric IDs for key purposes in the UI
    title: module.title,
    description: module.description,
    emoji: module.emoji,
    href: module.available ? `/modules/${module.id}` : "#",
    available: module.available
  }))

  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-primary/10">
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
            <Link href="/account">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white">
                Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary mb-4">
              Choose Your Module
            </h1>
            <p className="text-xl text-muted-foreground">
              Start your Persian learning journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {modules.map((module) => (
              <Card 
                key={module.id} 
                className={`transition-all duration-300 hover:shadow-lg ${
                  !module.available ? 'opacity-75' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl text-center flex items-center justify-center gap-2">
                    <span className="text-2xl">{module.emoji}</span>
                    <span>{module.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-6 min-h-[80px]">{module.description}</p>
                  {module.available ? (
                    <Link href={module.href}>
                      <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                        Start Module
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      className="w-full bg-muted text-muted-foreground cursor-not-allowed"
                      disabled
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © 2025 Iranopedia. All rights reserved.
              </p>
            </div>
            <div className="flex gap-4">
              {/* Links removed as per request */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 