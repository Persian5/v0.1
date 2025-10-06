"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SubscribeButton } from "@/components/SubscribeButton"
import { Lock, Sparkles, Zap, Trophy, BookOpen } from "lucide-react"

interface PremiumLockModalProps {
  isOpen: boolean
  onClose: () => void
  moduleTitle?: string
}

export function PremiumLockModal({ isOpen, onClose, moduleTitle }: PremiumLockModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Unlock {moduleTitle || "Premium Modules"}
          </DialogTitle>
          <DialogDescription className="text-center">
            Get unlimited access to all Persian lessons and features with a Premium subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits List */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
                <BookOpen className="h-3 w-3 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">All Modules Unlocked</p>
                <p className="text-xs text-muted-foreground">Access all 11 Persian learning modules</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
                <Sparkles className="h-3 w-3 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">New Content Regularly</p>
                <p className="text-xs text-muted-foreground">Fresh lessons added every month</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
                <Zap className="h-3 w-3 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Interactive Learning</p>
                <p className="text-xs text-muted-foreground">Games, quizzes, and real conversations</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
                <Trophy className="h-3 w-3 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Track Your Progress</p>
                <p className="text-xs text-muted-foreground">XP, streaks, and achievement badges</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-lg bg-gradient-to-br from-accent/10 to-primary/10 p-4 text-center">
            <div className="text-3xl font-bold text-accent">$4.99</div>
            <div className="text-sm text-muted-foreground">per month • cancel anytime</div>
          </div>

          {/* Subscribe Button */}
          <SubscribeButton className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white font-semibold">
            Upgrade to Premium
          </SubscribeButton>

          {/* Footer Note */}
          <p className="text-center text-xs text-muted-foreground">
            Start learning Persian today. No commitment required.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

