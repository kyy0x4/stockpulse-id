import { useEffect, useRef } from 'react'

/**
 * BackgroundGlow — gradient glow effect untuk AuthPage.
 * Dark navy solid + radial glow turquoise/cyan yang bergerak halus.
 * Konsisten sama tema MARKETIQ (no chart animation).
 */
export default function BackgroundGlow({ height = 500 }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    let time = 0
    const draw = () => {
      const w = canvas.width / window.devicePixelRatio
      const h = height

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#030D1E')
      bg.addColorStop(0.5, '#0a1628')
      bg.addColorStop(1, '#0F1E35')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Moving glow orbs
      const orb1X = w * 0.3 + Math.sin(time * 0.005) * 40
      const orb1Y = h * 0.3 + Math.cos(time * 0.007) * 30

      const glow1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, 200)
      glow1.addColorStop(0, 'rgba(34, 227, 213, 0.08)')
      glow1.addColorStop(0.5, 'rgba(34, 227, 213, 0.03)')
      glow1.addColorStop(1, 'rgba(34, 227, 213, 0)')
      ctx.fillStyle = glow1
      ctx.fillRect(0, 0, w, h)

      const orb2X = w * 0.7 + Math.cos(time * 0.003) * 30
      const orb2Y = h * 0.7 + Math.sin(time * 0.004) * 40

      const glow2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, 180)
      glow2.addColorStop(0, 'rgba(13, 196, 233, 0.06)')
      glow2.addColorStop(0.5, 'rgba(13, 196, 233, 0.02)')
      glow2.addColorStop(1, 'rgba(13, 196, 233, 0)')
      ctx.fillStyle = glow2
      ctx.fillRect(0, 0, w, h)

      // Subtle grid
      ctx.strokeStyle = 'rgba(42, 58, 82, 0.15)'
      ctx.lineWidth = 1
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      time += 1
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [height])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: height, zIndex: 0, opacity: 1 }}
    />
  )
}
