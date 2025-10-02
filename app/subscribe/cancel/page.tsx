export const dynamic = "force-dynamic";

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SubscribeCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center py-12 px-4">
      <Card className="max-w-2xl w-full border-2 border-muted shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <X className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-3xl">Subscription Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg text-muted-foreground">
              No worries! Your checkout was cancelled and you haven't been charged.
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-lg">You Can Still:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Access all of Module 1 for free</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Practice your Persian greetings and introductions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Track your progress and earn XP</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Subscribe later when you're ready</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/modules')}
              size="lg"
              className="w-full"
            >
              Continue with Free Lessons
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/subscribe')}
              className="w-full"
            >
              Try Again
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Have questions? We're here to help!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

