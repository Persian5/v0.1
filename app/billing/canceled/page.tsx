"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function BillingCanceledPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-orange-500">
            <XCircle className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl">Subscription Canceled</CardTitle>
          <CardDescription>
            You canceled the checkout process. No charges were made to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              You can still access Module 1 lessons for free. When you're ready to unlock all 
              modules and continue your Persian learning journey, you can subscribe anytime.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="w-full">
              <Link href="/modules">Back to Lessons</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/pricing">View Pricing Again</Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Questions? Contact us at support@iranopedia.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
