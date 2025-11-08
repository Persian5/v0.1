"use client";

import React from "react";
import { useRouter } from "next/navigation";
import BaseErrorBoundary from "./BaseErrorBoundary";

interface Props {
  children: React.ReactNode;
}

export default function PageErrorBoundary({ children }: Props) {
  const router = useRouter();

  return (
    <BaseErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center h-screen text-center bg-[#FAF8F3] p-6">
          <h2 className="text-lg font-semibold mb-4">
            Something went wrong. Return to dashboard?
          </h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-[#10B981] text-white rounded-lg shadow-md hover:opacity-90 transition"
          >
            Go to Dashboard
          </button>
        </div>
      }
    >
      {children}
    </BaseErrorBoundary>
  );
}

