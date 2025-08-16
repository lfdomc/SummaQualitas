'use client'

import { useCounterAnimation } from '@/hooks/use-counter-animation'

interface AnimatedCounterProps {
  end: number
  suffix?: string
  duration?: number
  className?: string
}

export function AnimatedCounter({ end, suffix = '', duration = 2000, className = '' }: AnimatedCounterProps) {
  const { count, ref } = useCounterAnimation({ end, duration })

  return (
    <div ref={ref} className={className}>
      {count}{suffix}
    </div>
  )
}