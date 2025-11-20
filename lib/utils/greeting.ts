/**
 * Get a time-based greeting
 * Returns just the greeting text (e.g., "Good afternoon") and name separately
 * so the component can add the wave icon after the name
 */
export function getGreetingParts(name?: string | null): { greeting: string; name: string | null } {
  const hour = new Date().getHours()
  let greeting = 'Good morning'
  
  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon'
  } else if (hour >= 17) {
    greeting = 'Good evening'
  }
  
  if (name) {
    // Get first name only
    const firstName = name.split(' ')[0]
    return { greeting, name: firstName }
  }
  
  return { greeting, name: null }
}

/**
 * Legacy function for backward compatibility
 */
export function getGreeting(name?: string | null): string {
  const { greeting, name: firstName } = getGreetingParts(name)
  if (firstName) {
    return `${greeting}, ${firstName}!`
  }
  return `${greeting}!`
}

