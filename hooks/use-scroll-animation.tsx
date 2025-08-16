'use client'

import { useState, useEffect, useRef } from 'react'

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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setTimeout(() => {
            setIsVisible(true)
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
  }, [threshold, delay, isVisible])

  const animationClasses = isVisible 
    ? 'opacity-100 translate-y-0' 
    : 'opacity-0 translate-y-8'

  const style = {
    transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`
  }

  return { ref, animationClasses, style, isVisible }
}