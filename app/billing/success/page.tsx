"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { SmartAuthService } from "@/lib/services/smart-auth-service";

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 45000;
const SUPPORT_EMAIL = "iranopedia5@gmail.com";

type VerifyStatus = "processing" | "verified" | "invalid_session" | "failed" | "timeout" | "unauthenticated";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<VerifyStatus>("processing");
  const [startTime] = useState(() => Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!sessionId || sessionId.trim() === "") {
      setStatus("invalid_session");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/verify-checkout-session?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();

        if (res.status === 401) {
          setStatus("unauthenticated");
          stopPolling();
          return;
        }

        if (res.status === 400 && data.status === "invalid_session") {
          setStatus("invalid_session");
          stopPolling();
          return;
        }

        if (data.verified && data.status === "verified") {
          await SmartAuthService.refreshPremiumStatus();
          setStatus("verified");
          stopPolling();
          return;
        }

        if (data.status === "failed") {
          setStatus("failed");
          stopPolling();
          return;
        }

        if (Date.now() - startTime >= TIMEOUT_MS) {
          setStatus("timeout");
          stopPolling();
        }
      } catch {
        setStatus("failed");
        stopPolling();
      }
    };

    verify();

    pollRef.current = setInterval(() => {
      if (Date.now() - startTime >= TIMEOUT_MS) {
        setStatus("timeout");
        stopPolling();
        return;
      }
      verify();
    }, POLL_INTERVAL_MS);

    return () => stopPolling();
  }, [sessionId, startTime, stopPolling]);

  if (status === "invalid_session") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-amber-600">
              <AlertCircle className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl">Invalid Session</CardTitle>
            <CardDescription>
              This page requires a valid checkout session. If you just completed a payment, please return from the link in your confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/pricing">Go to Pricing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-amber-600">
              <AlertCircle className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl">Sign In to Confirm</CardTitle>
            <CardDescription>
              Please sign in to verify your subscription. If you just completed payment, your subscription will be active once you sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/account">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full mt-2">
              <Link href="/modules">Continue to Modules</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "failed" || status === "timeout") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-amber-600">
              <AlertCircle className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl">
              {status === "timeout" ? "Still Processing" : "Something Went Wrong"}
            </CardTitle>
            <CardDescription>
              {status === "timeout"
                ? "Your payment may still be processing. If you were charged, please contact us and we will activate your subscription."
                : "We could not verify your payment. If you were charged, please contact us with your session ID."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Contact: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">{SUPPORT_EMAIL}</a>
              {sessionId && (
                <>
                  <br />
                  Session ID: {sessionId.slice(0, 24)}...
                </>
              )}
            </p>
            <Button asChild size="lg" className="w-full">
              <Link href="/modules">Continue to Modules</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/account">View Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-green-600">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl">Welcome to Premium</CardTitle>
            <CardDescription>
              Your subscription is now active. You have full access to all modules and lessons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 text-sm">
              <p className="font-semibold text-primary mb-2">What&apos;s next?</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Access all Persian modules and lessons</li>
                <li>Track your progress with XP and streaks</li>
                <li>Learn authentic conversational Persian</li>
                <li>New content added regularly</li>
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-primary">
            <Loader2 className="h-12 w-12 animate-spin" />
          </div>
          <CardTitle className="text-2xl">Processing Payment</CardTitle>
          <CardDescription>
            We&apos;re confirming your subscription. This will only take a moment.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-primary">
                <Loader2 className="h-12 w-12 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Loading</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
