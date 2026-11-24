import { useEffect, useRef } from 'react'

/**
 * BackgroundChart — animasi garis trading di sisi kiri AuthPage.
 * Canvas-based, menggambar line chart yang bergerak halus.
 * Warna: turquoise/cyan MARKETIQ di atas navy gelap.
 */
export default function BackgroundChart({ height = 500 }) {
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

    // Generate smooth sine-like trading line
    const points = []
    for (let i = 0; i < 120; i++) {
      points.push({
        x: i,
        base: Math.sin(i * 0.05) * 40 + Math.sin(i * 0.12) * 20 + Math.sin(i * 0.02) * 60
      })
    }

    let time = 0

    const draw = () => {
      const w = canvas.width / window.devicePixelRatio
      const h = height
      ctx.clearRect(0, 0, w, h)

      // Horizontal grid lines (subtle)
      ctx.strokeStyle = 'rgba(42, 58, 82, 0.4)'
      ctx.lineWidth = 1
      for (let y = 0; y < h; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y + 20)
        ctx.lineTo(w, y + 20)
        ctx.stroke()
      }

      // Calculate y offset (center line)
      const midY = h / 2

      // Draw area fill (gradient under line)
      const gradient = ctx.createLinearGradient(0, 0, 0, h)
      gradient.addColorStop(0, 'rgba(34, 227, 213, 0.12)')
      gradient.addColorStop(1, 'rgba(13, 196, 233, 0.02)')

      ctx.beginPath()
      ctx.moveTo(0, midY + points[0].base + Math.sin(time * 0.01) * 10)
      for (let i = 1; i < points.length; i++) {
        const px = (i / points.length) * w
        const py = midY + points[i].base + Math.sin(time * 0.01 + i * 0.1) * 12
        ctx.lineTo(px, py)
      }
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw main line (turquoise)
      ctx.beginPath()
      ctx.moveTo(0, midY + points[0].base + Math.sin(time * 0.01) * 10)
      for (let i = 1; i < points.length; i++) {
        const px = (i / points.length) * w
        const py = midY + points[i].base + Math.sin(time * 0.01 + i * 0.1) * 12
        ctx.lineTo(px, py)
      }
      ctx.strokeStyle = '#22E3D5'
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.stroke()

      // Draw second line (cyan, offset)
      ctx.beginPath()
      for (let i = 0; i < points.length; i++) {
        const px = (i / points.length) * w
        const py = midY + points[i].base * 0.6 + Math.sin(time * 0.008 + i * 0.08) * 18 + 40
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = 'rgba(13, 196, 233, 0.5)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Candle-like markers
      for (let i = 0; i < points.length; i += 8) {
        const px = (i / points.length) * w
        const py = midY + points[i].base + Math.sin(time * 0.01 + i * 0.1) * 12
        const bullish = points[(i + 4) % points.length].base > points[i].base
        ctx.fillStyle = bullish ? 'rgba(34, 227, 213, 0.4)' : 'rgba(244, 67, 54, 0.3)'
        ctx.fillRect(px - 2, py - 6, 4, bullish ? -8 : 8)
        ctx.fillRect(px - 2, py - (bullish ? 14 : -2), 4, 8)
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
      style={{ position: 'absolute', inset: 0, width: '100%', height: height, zIndex: 0, opacity: 0.7 }}
    />
  )
}
