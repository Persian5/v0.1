/**
 * Design Tokens
 * Centralized design system tokens for consistent UI across the application
 * Based on analysis: DASHBOARD_UI_ANALYSIS_AND_RECOMMENDATIONS.md
 */

export const colors = {
  // Primary brand color (Persian blue)
  primary: {
    DEFAULT: "#1E40AF",
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#1E40AF", // Main
    600: "#1E3A8A",
    700: "#1E3A8A",
    800: "#1E3A8A",
    900: "#1E3A8A",
  },
  // Success (mastered, achievements)
  success: {
    DEFAULT: "#10B981",
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981", // Main
    600: "#059669",
  },
  // Warning (streaks, goals)
  warning: {
    DEFAULT: "#F59E0B",
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B", // Main
    600: "#D97706",
  },
  // Error (hard words, needs attention)
  error: {
    DEFAULT: "#EF4444",
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444", // Main
    600: "#DC2626",
  },
  // Neutral grays
  neutral: {
    DEFAULT: "#6B7280",
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
} as const

export const spacing = {
  xs: "0.5rem",   // 8px
  sm: "1rem",     // 16px
  md: "1.5rem",   // 24px
  lg: "2rem",     // 32px
  xl: "3rem",     // 48px
  "2xl": "4rem",  // 64px
} as const

export const borderRadius = {
  sm: "0.5rem",   // 8px
  md: "0.75rem",  // 12px
  lg: "1rem",     // 16px
  xl: "1.5rem",   // 24px
  full: "9999px",
} as const

export const typography = {
  // Font sizes
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem",  // 36px
    "5xl": "3rem",     // 48px
  },
  // Font weights
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  // Line heights
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },
} as const

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
} as const

export const breakpoints = {
  sm: "640px",   // Mobile landscape
  md: "768px",   // Tablet
  lg: "1024px",  // Desktop
  xl: "1280px",  // Large desktop
  "2xl": "1536px", // Extra large desktop
} as const

// Touch target sizes (accessibility)
export const touchTargets = {
  min: "48px",   // Minimum touch target (WCAG 2.1)
  comfortable: "56px", // Comfortable touch target
} as const

// Card styles (unified)
export const cardStyles = {
  background: "bg-white",
  border: "border border-neutral-200",
  borderRadius: "rounded-lg",
  padding: {
    mobile: "p-4",
    desktop: "p-6",
  },
  shadow: "shadow-sm",
  shadowHover: "hover:shadow-md",
  transition: "transition-all duration-200",
} as const

// Grid layouts
export const gridLayouts = {
  mobile: {
    stats: "grid-cols-2",      // 2x2 grid for stats
    actions: "grid-cols-2",    // 2x2 grid for quick actions
    hero: "grid-cols-1",       // Single column for hero
  },
  tablet: {
    stats: "grid-cols-3",      // 3 columns for stats
    actions: "grid-cols-2",    // 2 columns for actions
    hero: "grid-cols-2",       // 2x2 grid for hero
  },
  desktop: {
    stats: "grid-cols-4",      // 4 columns for stats
    actions: "grid-cols-4",    // 4 columns for actions
    hero: "grid-cols-4",       // 4 columns for hero
  },
} as const

