'use client'

import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { ReactNode } from 'react'

interface ScrollAnimationProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  threshold?: number
}

export function ScrollAnimation({ 
  children, 
  className = '', 
  delay = 0, 
  duration = 600, 
  threshold = 0.1 
}: ScrollAnimationProps) {
  const { ref, animationClasses, style } = useScrollAnimation({ 
    threshold, 
    delay, 
    duration 
  })

  return (
    <div 
      ref={ref} 
      className={`${animationClasses} ${className}`} 
      style={style}
    >
      {children}
    </div>
  )
}