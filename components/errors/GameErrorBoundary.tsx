"use client";

import React from "react";
import BaseErrorBoundary from "./BaseErrorBoundary";

interface Props {
  children: React.ReactNode;
}

export default function GameErrorBoundary({ children }: Props) {
  return (
    <BaseErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center h-full min-h-screen text-center bg-[#FAF8F3] p-6">
          <h2 className="text-lg font-semibold mb-4">
            Game crashed. Your progress is saved.
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#10B981] text-white rounded-lg shadow-md hover:opacity-90 transition"
          >
            Restart Game
          </button>
        </div>
      }
    >
      {children}
    </BaseErrorBoundary>
  );
}

