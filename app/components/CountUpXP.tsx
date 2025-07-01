import { useEffect, useRef, useState } from 'react'

interface CountUpXPProps {
  target: number
}

export function CountUpXP({ target }: CountUpXPProps) {
  const previous = useRef<number>(0)
  const [current, setCurrent] = useState<number>(previous.current)

  useEffect(() => {
    const start = previous.current
    const diff = target - start
    if (diff === 0) return

    const duration = 800
    const steps = 30
    const stepTime = duration / steps
    let step = 0

    const interval = setInterval(() => {
      step += 1
      const value = Math.round(start + (diff * step) / steps)
      setCurrent(value)
      if (step >= steps) {
        clearInterval(interval)
        previous.current = target
      }
    }, stepTime)

    return () => clearInterval(interval)
  }, [target])

  return <span>{current.toLocaleString()} XP</span>
} 