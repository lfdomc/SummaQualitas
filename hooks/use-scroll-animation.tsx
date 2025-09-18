'use client'

import { useState, useEffect, useRef, CSSProperties } from 'react'

interface UseScrollAnimationProps {
  threshold?: number
  delay?: number
  duration?: number
}

export function useScrollAnimation({ 
  threshold = 0.1, 
  delay = 0, 
  duration = 600 
}: UseScrollAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setTimeout(() => {
            setIsVisible(true)
            setHasAnimated(true)
          }, delay)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold, delay, hasAnimated])

  const animationClass = isVisible 
    ? 'animate-fade-in-up opacity-100 translate-y-0' 
    : 'opacity-0 translate-y-8'

  const style: CSSProperties = {
    transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  }

  return { ref, animationClass, style }
}