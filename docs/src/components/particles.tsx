'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface ParticlesProps {
  density?: number
  linkDistance?: number
  speed?: number
  className?: string
}

export function Particles({
  density = 60,
  linkDistance = 140,
  speed = 0.25,
  className,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let particles: Particle[] = []
    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      const count = Math.min(
        density,
        Math.max(20, Math.round((width * height) / 18000)),
      )
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        radius: 1 + Math.random() * 1.5,
      }))
    }

    const getStrokeColor = () => {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      return isDark ? 'rgba(180, 180, 220, 0.45)' : 'rgba(80, 80, 120, 0.45)'
    }

    const tick = () => {
      ctx.clearRect(0, 0, width, height)
      const stroke = getStrokeColor()
      const mouse = mouseRef.current

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.hypot(dx, dy)
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120
            p.x += (dx / dist) * force * 0.6
            p.y += (dy / dist) * force * 0.6
          }
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = stroke
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist < linkDistance) {
            const opacity = 1 - dist / linkDistance
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = stroke.replace(
              /[\d.]+\)$/,
              `${(opacity * 0.4).toFixed(3)})`,
            )
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      }
    }
    const onMouseLeave = () => {
      mouseRef.current.active = false
    }

    resize()
    rafRef.current = requestAnimationFrame(tick)

    window.addEventListener('resize', resize)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [density, linkDistance, speed])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
