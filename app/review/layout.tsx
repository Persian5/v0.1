"use client"

/**
 * Single layout for all review routes: /review, /review/audio-definitions, etc.
 * Keeps "Review" as one section with shared header and back navigation.
 */
export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {children}
    </div>
  )
}
