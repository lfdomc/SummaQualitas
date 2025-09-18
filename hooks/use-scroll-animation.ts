'use client'

import { useEffect, useRef, useState } from 'react'

interface UseScrollAnimationProps {
  threshold?: number
  delay?: number
  duration?: number
}

export function useScrollAnimation({ 
  threshold = 0.1, 
  delay = 0, 
  duration = 600 
}: UseScrollAnimationProps = {}) {
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

    return () => observer.disconnect()
  }, [threshold, delay, hasAnimated])

  const animationClass = isVisible 
    ? 'opacity-100 translate-y-0 transform transition-all ease-out'
    : 'opacity-0 translate-y-8 transform transition-all ease-out'

  const style = {
    transitionDuration: `${duration}ms`
  }

  return { 
    ref, 
    isVisible, 
    animationClass,
    style
  }
}