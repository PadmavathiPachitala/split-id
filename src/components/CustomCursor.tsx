'use client'

import { useEffect, useState, useRef } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  
  const mouseRef = useRef({ x: 0, y: 0 })
  const trailRef = useRef({ x: 0, y: 0 })
  const requestRef = useRef<number | null>(null)

  const [isHovered, setIsHovered] = useState(false)
  const [isHidden, setIsHidden] = useState(true)

  useEffect(() => {
    // Check if device is mobile/touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      setIsHidden(false)

      // Directly update the dot position in the DOM for maximum efficiency
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`
      }
    }

    const handleMouseLeave = () => {
      setIsHidden(true)
    }

    const handleMouseEnter = () => {
      setIsHidden(false)
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      // Check if target is a link, button, input, select, textarea, or has pointer cursor
      const isClickable =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('a') ||
        target.closest('button') ||
        window.getComputedStyle(target).cursor === 'pointer'

      setIsHovered(!!isClickable)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseover', handleMouseOver)
    }
  }, [])

  // Smooth trailing (interpolation / lerp) executed directly on DOM ref
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return

    const animateTrail = () => {
      const dx = mouseRef.current.x - trailRef.current.x
      const dy = mouseRef.current.y - trailRef.current.y
      
      trailRef.current.x += dx * 0.15
      trailRef.current.y += dy * 0.15

      // Directly update the ring position and scale in the DOM for smooth performance
      if (ringRef.current) {
        const scale = isHovered ? 1.8 : 1
        ringRef.current.style.transform = `translate3d(${trailRef.current.x}px, ${trailRef.current.y}px, 0) translate(-50%, -50%) scale(${scale})`
      }

      requestRef.current = requestAnimationFrame(animateTrail)
    }

    requestRef.current = requestAnimationFrame(animateTrail)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [isHovered])

  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  if (isTouchDevice) return null

  return (
    <>
      {/* Central core dot */}
      <div
        ref={dotRef}
        className="fixed w-2 h-2 bg-indigo-500 rounded-full pointer-events-none z-[9999] top-0 left-0 mix-blend-screen transition-opacity duration-300"
        style={{
          opacity: isHidden ? 0 : 1,
        }}
      />
      {/* Trailing outer ring */}
      <div
        ref={ringRef}
        className={`fixed w-8 h-8 rounded-full pointer-events-none z-[9998] top-0 left-0 border border-indigo-500/35 transition-[opacity,border-color,background-color,box-shadow] duration-300 ${
          isHovered
            ? 'bg-indigo-500/8 border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
            : 'shadow-[0_0_8px_rgba(99,102,241,0.08)]'
        }`}
        style={{
          opacity: isHidden ? 0 : 1,
        }}
      />
    </>
  )
}
