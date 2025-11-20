/**
 * Get a time-based greeting
 */
export function getGreeting(name?: string | null): string {
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
    return `${greeting}, ${firstName}`
  }
  
  return `${greeting}!`
}

