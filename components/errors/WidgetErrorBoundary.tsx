"use client";

import React, { useState } from "react";
import BaseErrorBoundary from "./BaseErrorBoundary";

interface Props {
  children: React.ReactNode;
}

export default function WidgetErrorBoundary({ children }: Props) {
  const [key, setKey] = useState(0);

  const handleRetry = () => {
    // Reset the boundary by changing key, which remounts the children
    setKey(prev => prev + 1);
  };

  return (
    <BaseErrorBoundary
      key={key}
      fallback={
        <div className="flex flex-col items-center justify-center p-4 text-center bg-[#FAF8F3] border border-gray-200 rounded-lg">
          <p className="text-sm font-medium mb-3">
            Widget failed to load. Please retry.
          </p>
          <button
            onClick={handleRetry}
            className="px-3 py-1.5 bg-[#10B981] text-white text-sm rounded-md shadow-sm hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      }
    >
      {children}
    </BaseErrorBoundary>
  );
}

