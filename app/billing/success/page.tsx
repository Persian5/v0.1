"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Give webhook a moment to process (usually < 1 second)
    const timer = setTimeout(() => {
      setVerifying(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {verifying ? (
            <>
              <div className="mx-auto mb-4 h-12 w-12 text-primary">
                <Loader2 className="h-12 w-12 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Processing Payment...</CardTitle>
              <CardDescription>
                We're confirming your subscription. This will only take a moment.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 h-12 w-12 text-green-600">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <CardTitle className="text-2xl">Welcome to Premium! 🎉</CardTitle>
              <CardDescription>
                Your subscription is now active. You have full access to all modules and lessons.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!verifying && (
            <>
              <div className="bg-primary/5 rounded-lg p-4 text-sm">
                <p className="font-semibold text-primary mb-2">What's next?</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ Access all Persian modules and lessons</li>
                  <li>✓ Track your progress with XP and streaks</li>
                  <li>✓ Learn authentic conversational Persian</li>
                  <li>✓ New content added regularly</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button asChild size="lg" className="w-full">
                  <Link href="/modules">Start Learning Now</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/account">View Account</Link>
                </Button>
              </div>

              {sessionId && (
                <p className="text-xs text-center text-muted-foreground">
                  Session ID: {sessionId.slice(0, 20)}...
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-primary">
              <Loader2 className="h-12 w-12 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
