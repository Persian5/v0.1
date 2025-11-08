"use client"

import { ReactNode } from "react"

interface BlurredPreviewContainerProps {
  children: ReactNode
  header?: ReactNode
}

/**
 * Reusable container for blurred preview backgrounds
 * Ensures consistent blur effect across all preview pages
 */
export function BlurredPreviewContainer({ children, header }: BlurredPreviewContainerProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col pointer-events-none relative">
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0" />
      
      {/* Header (if provided) */}
      {header && (
        <div className="relative z-10">
          {header}
        </div>
      )}
      
      {/* Content - always above blur */}
      <div className="flex-1 relative z-10">
        {children}
      </div>
    </div>
  )
}

