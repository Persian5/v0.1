"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { AuthModal } from "@/components/auth/AuthModal"

export function AccountNavButton({ size = "sm" }: { size?: "sm" | "default" }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
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