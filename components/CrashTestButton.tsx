"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

/**
 * Dev-only crash test button for testing error boundaries
 * Only renders in development mode
 */
export function CrashTestButton() {
  const [shouldCrash, setShouldCrash] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Trigger a crash when state changes
  if (shouldCrash) {
    throw new Error("💥 Crash Test: This is a deliberate error to test error boundaries");
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setShouldCrash(true)}
      className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 transition-opacity"
      title="Trigger crash test (dev only)"
    >
      <Bug className="h-4 w-4 mr-2" />
      Crash Test
    </Button>
  );
}

