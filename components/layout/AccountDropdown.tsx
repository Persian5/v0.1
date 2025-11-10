"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut, Settings, RotateCcw, Crown, CreditCard } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePremium } from '@/hooks/use-premium'

/**
 * Account dropdown menu for desktop navigation
 * Shows different options based on premium status
 */
export function AccountDropdown() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { hasPremium } = usePremium()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
    router.push('/')
  }

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Account</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-[55]">
          {/* Premium-specific items */}
          {hasPremium ? (
            <button
              onClick={() => handleNavigation('/account#subscription')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <CreditCard className="w-4 h-4" />
              <span>Manage Subscription</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavigation('/pricing')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors text-left"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade to Premium</span>
            </button>
          )}

          {/* Divider */}
          <div className="my-1 h-px bg-gray-200" />

          {/* Dashboard */}
          <button
            onClick={() => handleNavigation('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <Settings className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Profile & Settings */}
          <button
            onClick={() => handleNavigation('/account')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <Settings className="w-4 h-4" />
            <span>Profile & Settings</span>
          </button>

          {/* Reset Progress */}
          <button
            onClick={() => handleNavigation('/account#reset')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Progress</span>
          </button>

          {/* Divider */}
          <div className="my-1 h-px bg-gray-200" />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}

