"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth/AuthProvider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Check, Lock } from "lucide-react"

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/auth/verify')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Call our checkout API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      console.error('Subscribe error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Unlock Full Access to Persian Learning
          </h1>
          <p className="text-lg text-muted-foreground">
            Continue your journey beyond Module 1
          </p>
        </div>

        {/* Pricing Card */}
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">Premium Plan</CardTitle>
            <CardDescription>
              <span className="text-4xl font-bold text-primary">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg mb-4">What's Included:</h3>
              <div className="space-y-2">
                {[
                  "Access to all modules and lessons",
                  "Interactive games and exercises",
                  "Audio pronunciation for every word",
                  "Progress tracking and XP system",
                  "Cultural context and real-life phrases",
                  "Regular content updates",
                  "Cancel anytime - no commitment",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscribe Button */}
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleSubscribe}
              disabled={loading}
              size="lg"
              className="w-full text-lg py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-5 w-5" />
                  Subscribe Now
                </>
              )}
            </Button>

            {/* Info Text */}
            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Stripe. Cancel anytime from your account settings.
            </p>

            {/* Back Link */}
            <div className="text-center pt-4">
              <Link 
                href="/modules" 
                className="text-sm text-primary hover:underline"
              >
                ← Back to Modules
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes! Cancel your subscription at any time from your account settings. 
                  You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's included in Module 1?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Module 1 (Greetings & Politeness) is completely free and includes multiple 
                  lessons teaching you essential Persian greetings, introductions, and polite phrases.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What do I get with Premium?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Premium unlocks Module 2 onwards, giving you access to advanced topics like 
                  numbers, age, family vocabulary, food, travel phrases, and much more coming soon.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

