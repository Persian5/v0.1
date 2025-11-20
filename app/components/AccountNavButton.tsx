"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { AuthModal } from "@/components/auth/AuthModal"

export function AccountNavButton({ size = "sm" }: { size?: "sm" | "default" }) {
  const { user, isLoading } = useAuth()
  const [open, setOpen] = useState(false)
  
  // FLICKER FIX: Show skeleton while auth is loading
  if (isLoading) {
    return (
      <div className={`rounded-md animate-pulse bg-gray-200 ${size === "sm" ? "h-9 w-24" : "h-10 w-28"}`} />
    )
  }
  
  if (user) {
    return (
      <Link href="/account">
        <Button size={size} className="bg-accent hover:bg-accent/90 text-white transition-all duration-200 hover:scale-105">
          Account
        </Button>
      </Link>
    )
  }
  return (
    <>
      <Button size={size} className="bg-accent hover:bg-accent/90 text-white transition-all duration-200 hover:scale-105" onClick={() => setOpen(true)}>
        Sign Up / Log In
      </Button>
      <AuthModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
} 