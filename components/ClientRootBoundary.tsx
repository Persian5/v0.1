"use client";

import BaseErrorBoundary from "@/components/errors/BaseErrorBoundary";

export default function ClientRootBoundary({ children }: { children: React.ReactNode }) {
  return <BaseErrorBoundary>{children}</BaseErrorBoundary>;
}

