import { useEffect, useRef } from 'react'

export default function DashboardBackground({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let t = 0

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ---- DATA NODES (floating coordinate points) ----
    const NODE_COUNT = 28
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00015,
      vy: (Math.random() - 0.5) * 0.00015,
      r: Math.random() * 2.5 + 1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      alpha: 0.3 + Math.random() * 0.4,
      type: Math.random() > 0.7 ? 'major' : 'minor',
      label: generateCoord(),
    }))

    function generateCoord() {
      const lat = (Math.random() * 160 - 80).toFixed(2)
      const lon = (Math.random() * 360 - 180).toFixed(2)
      return lat + ', ' + lon
    }

    // ---- ROUTE ARCS (connecting trade route nodes) ----
    const arcs = []
    for (let i = 0; i < 8; i++) {
      const n1 = Math.floor(Math.random() * NODE_COUNT)
      let n2 = Math.floor(Math.random() * NODE_COUNT)
      while (n2 === n1) n2 = Math.floor(Math.random() * NODE_COUNT)
      arcs.push({
        from: n1,
        to: n2,
        progress: Math.random(),
        speed: 0.001 + Math.random() * 0.002,
        alpha: 0.1 + Math.random() * 0.15,
        dotPos: Math.random(),
      })
    }

    // ---- RADAR SWEEP ----
    const radar = {
      x: 0.5,
      y: 0.5,
      angle: 0,
      speed: 0.008,
      radius: 0.35,
      blips: [],
    }

    // ---- GRID ----
    const GRID_SIZE = 60

    // ---- PARTICLES ----
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: -0.0001 - Math.random() * 0.0002,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.3 + 0.1,
      life: Math.random(),
      decay: 0.001 + Math.random() * 0.002,
    }))

    function drawBackground(ctx, w, h) {
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, '#020610')
      grad.addColorStop(0.5, '#030914')
      grad.addColorStop(1, '#020710')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
    }

    function drawGrid(ctx, w, h, t) {
      ctx.save()
      ctx.globalAlpha = 0.035
      ctx.strokeStyle = '#2060c0'
      ctx.lineWidth = 0.5

      const offsetX = (t * 8) % GRID_SIZE
      const offsetY = (t * 4) % GRID_SIZE

      for (let x = -offsetX; x < w; x += GRID_SIZE) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = -offsetY; y < h; y += GRID_SIZE) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      ctx.restore()

      // Bright intersections
      ctx.save()
      ctx.globalAlpha = 0.06
      ctx.fillStyle = '#4090e0'
      for (let x = -offsetX; x < w; x += GRID_SIZE) {
        for (let y = -offsetY; y < h; y += GRID_SIZE) {
          ctx.beginPath()
          ctx.arc(x, y, 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()
    }

    function drawRadar(ctx, w, h, t) {
      const rx = w * radar.x
      const ry = h * radar.y
      const radius = Math.min(w, h) * radar.radius

      ctx.save()

      // Radar background rings
      for (let ring = 1; ring <= 4; ring++) {
        const r = radius * (ring / 4)
        ctx.beginPath()
        ctx.arc(rx, ry, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(30,100,200,${0.06 - ring * 0.01})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Cross hairs
      ctx.strokeStyle = 'rgba(30,100,200,0.06)'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(rx - radius, ry)
      ctx.lineTo(rx + radius, ry)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(rx, ry - radius)
      ctx.lineTo(rx, ry + radius)
      ctx.stroke()

      // Radar sweep gradient
      const sweepAngle = radar.angle
      const sweepGrad = ctx.createConicalGradient
        ? ctx.createConicalGradient(sweepAngle, rx, ry)
        : null

      // Manual sweep using arc segments
      const sweepLength = Math.PI * 0.5
      for (let i = 0; i < 20; i++) {
        const frac = i / 20
        const angle = sweepAngle - sweepLength * frac
        ctx.beginPath()
        ctx.moveTo(rx, ry)
        ctx.arc(rx, ry, radius, angle, angle + sweepLength / 20)
        ctx.closePath()
        ctx.fillStyle = `rgba(0,200,100,${0.04 * (1 - frac)})`
        ctx.fill()
      }

      // Sweep line
      const lineGrad = ctx.createLinearGradient(
        rx, ry,
        rx + Math.cos(sweepAngle) * radius,
        ry + Math.sin(sweepAngle) * radius
      )
      lineGrad.addColorStop(0, 'rgba(0,220,120,0)')
      lineGrad.addColorStop(1, 'rgba(0,220,120,0.4)')
      ctx.beginPath()
      ctx.moveTo(rx, ry)
      ctx.lineTo(rx + Math.cos(sweepAngle) * radius, ry + Math.sin(sweepAngle) * radius)
      ctx.strokeStyle = lineGrad
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Center dot
      ctx.beginPath()
      ctx.arc(rx, ry, 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,220,120,0.5)'
      ctx.fill()

      // Radar blips (echo dots)
      radar.blips = radar.blips.filter(b => b.age < 120)
      radar.blips.forEach(blip => {
        const fade = 1 - blip.age / 120
        ctx.beginPath()
        ctx.arc(blip.x, blip.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,150,${fade * 0.6})`
        ctx.fill()
        blip.age++
      })

      // Generate new blips when sweep passes nodes
      nodes.forEach(node => {
        const nx = node.x * w
        const ny = node.y * h
        const dx = nx - rx
        const dy = ny - ry
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < radius) {
          const nodeAngle = Math.atan2(dy, dx)
          const angleDiff = ((sweepAngle - nodeAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
          if (angleDiff < 0.1) {
            radar.blips.push({ x: nx, y: ny, age: 0 })
          }
        }
      })

      ctx.restore()
    }

    function drawArcs(ctx, w, h) {
      arcs.forEach(arc => {
        const n1 = nodes[arc.from]
        const n2 = nodes[arc.to]
        const x1 = n1.x * w, y1 = n1.y * h
        const x2 = n2.x * w, y2 = n2.y * h
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.3

        // Arc path
        ctx.save()
        ctx.globalAlpha = arc.alpha
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.quadraticCurveTo(midX, midY, x2, y2)
        ctx.strokeStyle = 'rgba(40,120,220,0.5)'
        ctx.lineWidth = 0.8
        ctx.stroke()

        // Moving dot along arc
        const px = (1 - arc.dotPos) * (1 - arc.dotPos) * x1 +
                   2 * (1 - arc.dotPos) * arc.dotPos * midX +
                   arc.dotPos * arc.dotPos * x2
        const py = (1 - arc.dotPos) * (1 - arc.dotPos) * y1 +
                   2 * (1 - arc.dotPos) * arc.dotPos * midY +
                   arc.dotPos * arc.dotPos * y2

        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(80,180,255,0.8)'
        ctx.fill()

        // Dot glow
        const dotGrad = ctx.createRadialGradient(px, py, 0, px, py, 8)
        dotGrad.addColorStop(0, 'rgba(80,180,255,0.3)')
        dotGrad.addColorStop(1, 'rgba(80,180,255,0)')
        ctx.beginPath()
        ctx.arc(px, py, 8, 0, Math.PI * 2)
        ctx.fillStyle = dotGrad
        ctx.fill()

        ctx.restore()

        arc.dotPos += arc.speed
        if (arc.dotPos > 1) arc.dotPos = 0
      })
    }

    function drawNodes(ctx, w, h, t) {
      nodes.forEach(node => {
        const nx = node.x * w
        const ny = node.y * h
        const pulse = Math.sin(t + node.pulse) * 0.5 + 0.5

        if (node.type === 'major') {
          // Major node - glowing dot with rings
          ctx.save()
          ctx.globalAlpha = node.alpha * (0.5 + pulse * 0.5)

          // Outer pulse ring
          ctx.beginPath()
          ctx.arc(nx, ny, node.r * 4 + pulse * 6, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(40,160,255,0.15)'
          ctx.lineWidth = 1
          ctx.stroke()

          // Inner ring
          ctx.beginPath()
          ctx.arc(nx, ny, node.r * 2, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(60,180,255,0.4)'
          ctx.lineWidth = 0.8
          ctx.stroke()

          // Core dot
          ctx.beginPath()
          ctx.arc(nx, ny, node.r, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(100,200,255,0.9)'
          ctx.fill()

          // Crosshair
          ctx.strokeStyle = 'rgba(60,180,255,0.3)'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(nx - 10, ny)
          ctx.lineTo(nx + 10, ny)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(nx, ny - 10)
          ctx.lineTo(nx, ny + 10)
          ctx.stroke()

          ctx.restore()

          // Label
          ctx.save()
          ctx.globalAlpha = 0.2 + pulse * 0.15
          ctx.fillStyle = '#60b8ff'
          ctx.font = '9px monospace'
          ctx.fillText(node.label, nx + 8, ny - 4)
          ctx.restore()

        } else {
          // Minor node - simple dot
          ctx.save()
          ctx.globalAlpha = node.alpha * 0.6
          ctx.beginPath()
          ctx.arc(nx, ny, node.r, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(40,120,200,0.7)'
          ctx.fill()
          ctx.restore()
        }

        // Update position
        node.x += node.vx
        node.y += node.vy
        node.pulse += node.pulseSpeed
        if (node.x < 0 || node.x > 1) node.vx *= -1
        if (node.y < 0 || node.y > 1) node.vy *= -1
      })
    }

    function drawParticles(ctx, w, h) {
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.life -= p.decay

        if (p.life <= 0) {
          p.x = Math.random()
          p.y = 0.8 + Math.random() * 0.2
          p.vx = (Math.random() - 0.5) * 0.0003
          p.vy = -0.0001 - Math.random() * 0.0002
          p.life = 0.5 + Math.random() * 0.5
          p.alpha = Math.random() * 0.2 + 0.1
        }

        ctx.save()
        ctx.globalAlpha = p.alpha * p.life
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(30,80,180,1)'
        ctx.fill()
        ctx.restore()
      })
    }

    function drawVignette(ctx, w, h) {
      const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, w * 0.75)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(0,0,20,0.85)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
    }

    function drawHexPattern(ctx, w, h, t) {
      // Subtle hex grid in corners
      ctx.save()
      ctx.globalAlpha = 0.025
      ctx.strokeStyle = '#3060a0'
      ctx.lineWidth = 0.5
      const size = 30
      const rows = Math.ceil(h / (size * 1.5)) + 1
      const cols = Math.ceil(w / (size * Math.sqrt(3))) + 1

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * size * Math.sqrt(3) + (row % 2) * size * Math.sqrt(3) / 2
          const cy = row * size * 1.5
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6
            const px = cx + size * Math.cos(angle)
            const py = cy + size * Math.sin(angle)
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    function frame() {
      t += 0.016
      radar.angle += radar.speed

      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      drawBackground(ctx, w, h)
      drawGrid(ctx, w, h, t)
      drawHexPattern(ctx, w, h, t)
      drawRadar(ctx, w, h, t)
      drawArcs(ctx, w, h)
      drawNodes(ctx, w, h, t)
      drawParticles(ctx, w, h)
      drawVignette(ctx, w, h)

      animId = requestAnimationFrame(frame)
    }

    frame()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{ zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
