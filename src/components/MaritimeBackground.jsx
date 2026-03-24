import { useEffect, useRef } from 'react'

export default function MaritimeBackground({ className = '' }) {
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

    // ---- STARS ----
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.45,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.7 + 0.3,
    }))

    // ---- SHIPS ----
    class Ship {
      constructor(y, speed, scale, alpha) {
        this.x = -300 * scale
        this.y = y
        this.speed = speed
        this.scale = scale
        this.alpha = alpha
        this.bobOffset = Math.random() * Math.PI * 2
        this.wake = []
      }
      reset() {
        this.x = canvas.width + 200 * this.scale
        this.wake = []
      }
      draw(ctx, t) {
        const sc = this.scale
        const bobY = Math.sin(t * 0.8 + this.bobOffset) * 2 * sc
        const cx = this.x
        const cy = this.y + bobY
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.translate(cx, cy)
        ctx.scale(sc, sc)

        // Wake trail
        this.wake.push({ x: cx, y: cy + 8 * sc, age: 0 })
        if (this.wake.length > 60) this.wake.shift()

        ctx.restore()

        // Draw wake
        ctx.save()
        for (let i = 0; i < this.wake.length; i++) {
          const w = this.wake[i]
          const prog = i / this.wake.length
          ctx.beginPath()
          const spread = (this.wake.length - i) * 0.6 * sc
          ctx.moveTo(w.x, w.y - spread * 0.4)
          ctx.lineTo(w.x - spread * 2, w.y + spread * 0.8)
          ctx.lineTo(w.x + spread * 2, w.y + spread * 0.8)
          ctx.closePath()
          ctx.fillStyle = `rgba(100,160,220,${prog * 0.12 * this.alpha})`
          ctx.fill()
          this.wake[i].age++
        }
        ctx.restore()

        // Draw ship body
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.translate(cx, cy)
        ctx.scale(sc, sc)

        // Hull
        ctx.beginPath()
        ctx.moveTo(-80, 0)
        ctx.lineTo(-70, 12)
        ctx.lineTo(70, 12)
        ctx.lineTo(82, 0)
        ctx.lineTo(72, -2)
        ctx.lineTo(-70, -2)
        ctx.closePath()
        ctx.fillStyle = '#1a2a3a'
        ctx.fill()
        ctx.strokeStyle = '#2a4a6a'
        ctx.lineWidth = 1
        ctx.stroke()

        // Hull highlight
        ctx.beginPath()
        ctx.moveTo(-78, 0)
        ctx.lineTo(80, 0)
        ctx.strokeStyle = 'rgba(80,140,200,0.4)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Red bottom strip
        ctx.beginPath()
        ctx.moveTo(-68, 8)
        ctx.lineTo(68, 8)
        ctx.lineTo(70, 12)
        ctx.lineTo(-70, 12)
        ctx.closePath()
        ctx.fillStyle = '#8B1A1A'
        ctx.fill()

        // Superstructure
        ctx.beginPath()
        ctx.rect(-10, -22, 28, 20)
        ctx.fillStyle = '#223344'
        ctx.fill()
        ctx.strokeStyle = '#2a5070'
        ctx.lineWidth = 0.8
        ctx.stroke()

        // Bridge windows
        for (let i = 0; i < 4; i++) {
          ctx.beginPath()
          ctx.rect(-7 + i * 7, -19, 5, 4)
          ctx.fillStyle = 'rgba(180,220,255,0.7)'
          ctx.fill()
        }

        // Containers stack 1
        const containerColors = ['#c0392b','#2980b9','#27ae60','#f39c12','#8e44ad','#16a085']
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 8; col++) {
            const color = containerColors[(row * 3 + col) % containerColors.length]
            ctx.beginPath()
            ctx.rect(-68 + col * 11, -2 - (row + 1) * 8, 10, 7)
            ctx.fillStyle = color
            ctx.fill()
            ctx.strokeStyle = 'rgba(0,0,0,0.5)'
            ctx.lineWidth = 0.5
            ctx.stroke()
            // Container highlight
            ctx.beginPath()
            ctx.rect(-68 + col * 11, -2 - (row + 1) * 8, 10, 2)
            ctx.fillStyle = 'rgba(255,255,255,0.15)'
            ctx.fill()
          }
        }

        // Crane / Mast
        ctx.beginPath()
        ctx.moveTo(15, -22)
        ctx.lineTo(15, -46)
        ctx.strokeStyle = '#344a5a'
        ctx.lineWidth = 2
        ctx.stroke()

        // Radar dish
        ctx.beginPath()
        ctx.arc(15, -46, 4, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(100,200,255,0.6)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Smoke stack
        ctx.beginPath()
        ctx.rect(5, -38, 6, 16)
        ctx.fillStyle = '#1a2530'
        ctx.fill()

        ctx.restore()

        // Smoke puffs
        ctx.save()
        ctx.globalAlpha = this.alpha * 0.25
        for (let s = 0; s < 4; s++) {
          const puffX = cx + (10 + s * 18) * sc
          const puffY = cy - (44 + s * 12) * sc
          const puffR = (8 + s * 5) * sc
          const grad = ctx.createRadialGradient(puffX, puffY, 0, puffX, puffY, puffR)
          grad.addColorStop(0, 'rgba(180,200,220,0.5)')
          grad.addColorStop(1, 'rgba(180,200,220,0)')
          ctx.beginPath()
          ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        }
        ctx.restore()
      }
    }

    // ---- PLANES (Boeing 747 Freighter) ----
    class Plane {
      constructor(yRatio, speed, scale, alpha, fromRight) {
        this.fromRight = fromRight
        this.yRatio = yRatio
        this.speed = speed
        this.scale = scale
        this.alpha = alpha
        this.contrailPoints = []
        this.reset(true)
      }
      reset(init) {
        if (this.fromRight) {
          this.x = init ? Math.random() * canvas.width : canvas.width + 400
        } else {
          this.x = init ? Math.random() * canvas.width : -400
        }
        this.contrailPoints = []
      }
      draw(ctx, t) {
        const sc = this.scale
        const cx = this.x
        const cy = canvas.height * this.yRatio
        const dir = this.fromRight ? -1 : 1

        // Store contrail points (two trails for the wingtip vortices)
        this.contrailPoints.push({ x: cx, y: cy })
        if (this.contrailPoints.length > 100) this.contrailPoints.shift()

        // Draw two parallel contrails (engine exhaust)
        ctx.save()
        ctx.globalAlpha = this.alpha * 0.3
        const offsets = [-9 * sc, 9 * sc]
        offsets.forEach(offset => {
          for (let i = 1; i < this.contrailPoints.length; i++) {
            const prog = i / this.contrailPoints.length
            const width = prog * 4 * sc
            ctx.beginPath()
            ctx.moveTo(this.contrailPoints[i - 1].x, this.contrailPoints[i - 1].y + offset)
            ctx.lineTo(this.contrailPoints[i].x, this.contrailPoints[i].y + offset)
            ctx.strokeStyle = `rgba(230,240,255,${prog * 0.4})`
            ctx.lineWidth = width
            ctx.stroke()
          }
        })
        ctx.restore()

        // Draw Boeing 747 Freighter
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.translate(cx, cy)
        ctx.scale(dir * sc, sc)

        // === FUSELAGE - wide body, cylindrical ===
        // Main fuselage body (double-deck proportions)
        ctx.beginPath()
        ctx.ellipse(0, 0, 52, 9, 0, 0, Math.PI * 2)
        ctx.fillStyle = '#e8eef4'
        ctx.fill()

        // Upper deck hump (747 characteristic)
        ctx.beginPath()
        ctx.ellipse(14, -5, 26, 6, -0.1, 0, Math.PI * 2)
        ctx.fillStyle = '#dde5ee'
        ctx.fill()

        // Nose - pointed and slightly downward (747 characteristic)
        ctx.beginPath()
        ctx.moveTo(52, 0)
        ctx.bezierCurveTo(62, -1, 68, 1, 72, 3)
        ctx.bezierCurveTo(68, 4, 62, 4, 52, 8)
        ctx.closePath()
        ctx.fillStyle = '#c8d4e0'
        ctx.fill()

        // Cockpit windows (747 distinctive 6-window pattern)
        ctx.beginPath()
        ctx.fillStyle = 'rgba(100,180,255,0.75)'
        for (let w = 0; w < 3; w++) {
          ctx.rect(53 + w * 4, -3.5, 3, 4)
        }
        ctx.fill()

        // Fuselage nose radome (weather radar)
        ctx.beginPath()
        ctx.arc(70, 2, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#889aa8'
        ctx.fill()

        // Cargo door outline (main deck cargo door on left side)
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(100,140,180,0.5)'
        ctx.lineWidth = 0.8
        ctx.rect(20, -9, 16, 9)
        ctx.stroke()

        // Fuselage windows line (main deck)
        ctx.fillStyle = 'rgba(140,200,255,0.5)'
        for (let w = 0; w < 14; w++) {
          ctx.beginPath()
          ctx.rect(-30 + w * 5.5, -3, 3.5, 3)
          ctx.fill()
        }

        // Fuselage stripe (airline livery)
        ctx.beginPath()
        ctx.moveTo(-48, 3)
        ctx.lineTo(50, 3)
        ctx.strokeStyle = 'rgba(30,80,160,0.6)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Tail bottom stripe accent
        ctx.beginPath()
        ctx.moveTo(-48, 5)
        ctx.lineTo(48, 5)
        ctx.strokeStyle = 'rgba(50,120,200,0.3)'
        ctx.lineWidth = 1
        ctx.stroke()

        // === WINGS - large swept wings ===
        // Right wing (upper)
        ctx.beginPath()
        ctx.moveTo(10, -8)
        ctx.lineTo(0, -38)
        ctx.lineTo(-12, -44)
        ctx.lineTo(-22, -42)
        ctx.lineTo(-18, -30)
        ctx.lineTo(-6, -8)
        ctx.closePath()
        ctx.fillStyle = '#cdd8e4'
        ctx.fill()
        ctx.strokeStyle = 'rgba(120,160,200,0.3)'
        ctx.lineWidth = 0.5
        ctx.stroke()

        // Left wing (lower)
        ctx.beginPath()
        ctx.moveTo(10, 8)
        ctx.lineTo(0, 38)
        ctx.lineTo(-12, 44)
        ctx.lineTo(-22, 42)
        ctx.lineTo(-18, 30)
        ctx.lineTo(-6, 8)
        ctx.closePath()
        ctx.fillStyle = '#cdd8e4'
        ctx.fill()
        ctx.strokeStyle = 'rgba(120,160,200,0.3)'
        ctx.lineWidth = 0.5
        ctx.stroke()

        // Wing leading edge highlight
        ctx.beginPath()
        ctx.moveTo(10, -8)
        ctx.lineTo(-12, -44)
        ctx.strokeStyle = 'rgba(200,215,230,0.6)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(10, 8)
        ctx.lineTo(-12, 44)
        ctx.strokeStyle = 'rgba(200,215,230,0.6)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Winglets (upturned wingtips - modern 747-8F has these)
        ctx.beginPath()
        ctx.moveTo(-20, -43)
        ctx.lineTo(-26, -49)
        ctx.lineTo(-28, -46)
        ctx.lineTo(-22, -42)
        ctx.closePath()
        ctx.fillStyle = '#b8c8d8'
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(-20, 43)
        ctx.lineTo(-26, 49)
        ctx.lineTo(-28, 46)
        ctx.lineTo(-22, 42)
        ctx.closePath()
        ctx.fillStyle = '#b8c8d8'
        ctx.fill()

        // === ENGINES - 4 under-wing CFM56/GE CF6 style ===
        // Engine 1 (inner, right wing)
        ctx.beginPath()
        ctx.ellipse(-2, -20, 12, 4, -0.15, 0, Math.PI * 2)
        ctx.fillStyle = '#6a7e8e'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(-12, -20, 4.5, 0, Math.PI * 2)
        ctx.fillStyle = '#3a4e5e'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(-12, -20, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#1a2530'
        ctx.fill()

        // Engine 2 (outer, right wing)
        ctx.beginPath()
        ctx.ellipse(-13, -34, 10, 3.5, -0.15, 0, Math.PI * 2)
        ctx.fillStyle = '#6a7e8e'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(-22, -34, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#3a4e5e'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(-22, -34, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#1a2530'
        ctx.fill()

        // Engine 3 (inner, left wing)
        ctx.beginPath()
        ctx.ellipse(-2, 20, 12, 4, 0.15, 0, Math.PI * 2)
        ctx.fillStyle = '#6a7e8e'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(-12, 20, 4.5, 0, Math.PI * 2)
        ctx.fillStyle = '#3a4e5e'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(-12, 20, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#1a2530'
        ctx.fill()

        // Engine 4 (outer, left wing)
        ctx.beginPath()
        ctx.ellipse(-13, 34, 10, 3.5, 0.15, 0, Math.PI * 2)
        ctx.fillStyle = '#6a7e8e'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(-22, 34, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#3a4e5e'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(-22, 34, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#1a2530'
        ctx.fill()

        // Engine pylons (struts connecting engines to wings)
        ctx.strokeStyle = '#7a8e9e'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(-2, -18)
        ctx.lineTo(-1, -9)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-14, -32)
        ctx.lineTo(-12, -26)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-2, 18)
        ctx.lineTo(-1, 9)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-14, 32)
        ctx.lineTo(-12, 26)
        ctx.stroke()

        // Engine exhaust glow
        ctx.globalAlpha = this.alpha * 0.15
        const enginePositions = [[-12, -20], [-22, -34], [-12, 20], [-22, 34]]
        enginePositions.forEach(([ex, ey]) => {
          const grad = ctx.createRadialGradient(ex + 8, ey, 0, ex + 8, ey, 12)
          grad.addColorStop(0, 'rgba(255,200,80,0.8)')
          grad.addColorStop(0.5, 'rgba(255,140,40,0.3)')
          grad.addColorStop(1, 'rgba(255,80,0,0)')
          ctx.beginPath()
          ctx.ellipse(ex + 10, ey, 14, 4, 0, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        })
        ctx.globalAlpha = this.alpha

        // === TAIL ASSEMBLY ===
        // Horizontal stabilizers
        ctx.beginPath()
        ctx.moveTo(-38, -6)
        ctx.lineTo(-44, -18)
        ctx.lineTo(-52, -20)
        ctx.lineTo(-52, -16)
        ctx.lineTo(-44, -14)
        ctx.lineTo(-38, -6)
        ctx.closePath()
        ctx.fillStyle = '#c0ccd8'
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(-38, 6)
        ctx.lineTo(-44, 18)
        ctx.lineTo(-52, 20)
        ctx.lineTo(-52, 16)
        ctx.lineTo(-44, 14)
        ctx.lineTo(-38, 6)
        ctx.closePath()
        ctx.fillStyle = '#c0ccd8'
        ctx.fill()

        // Vertical stabilizer (tall)
        ctx.beginPath()
        ctx.moveTo(-36, -7)
        ctx.lineTo(-42, -28)
        ctx.lineTo(-50, -30)
        ctx.lineTo(-52, -24)
        ctx.lineTo(-42, -8)
        ctx.lineTo(-38, -7)
        ctx.closePath()
        ctx.fillStyle = '#b8c5d2'
        ctx.fill()

        // Airline tail logo (blue geometric on tail fin)
        ctx.beginPath()
        ctx.fillStyle = 'rgba(20,60,160,0.6)'
        ctx.rect(-50, -29, 8, 8)
        ctx.fill()

        // === LANDING GEAR (retracted - just bumps visible) ===
        ctx.beginPath()
        ctx.ellipse(-5, 9, 5, 2.5, 0, 0, Math.PI * 2)
        ctx.fillStyle = '#8a9eae'
        ctx.fill()

        // === NAVIGATION LIGHTS ===
        // Red wingtip light (right)
        ctx.beginPath()
        ctx.arc(-20, -43, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,60,60,${0.7 + 0.3 * Math.sin(t * 3)})`
        ctx.fill()
        // Green wingtip light (left)
        ctx.beginPath()
        ctx.arc(-20, 43, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(60,255,100,${0.7 + 0.3 * Math.sin(t * 3 + 1)})`
        ctx.fill()
        // White strobe (belly)
        ctx.beginPath()
        ctx.arc(0, 9, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${Math.sin(t * 5) > 0.8 ? 0.9 : 0.1})`
        ctx.fill()

        ctx.restore()
      }
    }
    // Create entities
    const ships = [
      new Ship(canvas.height * 0.72, 0.25, 1.1, 0.85),
      new Ship(canvas.height * 0.78, 0.18, 0.75, 0.65),
      new Ship(canvas.height * 0.82, 0.12, 0.5, 0.45),
    ]
    ships[0].x = canvas.width * 0.15
    ships[1].x = canvas.width * 0.55
    ships[2].x = canvas.width * 0.75

    const planes = [
      new Plane(0.12, 0.9, 1.1, 0.9, false),
      new Plane(0.22, 0.6, 0.75, 0.7, true),
      new Plane(0.08, 0.4, 0.55, 0.5, false),
    ]

    // Wave layers
    function drawSky(ctx, w, h) {
      const grad = ctx.createLinearGradient(0, 0, 0, h * 0.62)
      grad.addColorStop(0, '#020408')
      grad.addColorStop(0.3, '#030810')
      grad.addColorStop(0.7, '#040c18')
      grad.addColorStop(1, '#061020')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h * 0.62)
    }

    function drawHorizonGlow(ctx, w, h) {
      const hy = h * 0.6
      const grad = ctx.createLinearGradient(0, hy - 60, 0, hy + 40)
      grad.addColorStop(0, 'rgba(0,30,80,0)')
      grad.addColorStop(0.4, 'rgba(10,50,120,0.25)')
      grad.addColorStop(0.6, 'rgba(20,80,160,0.15)')
      grad.addColorStop(1, 'rgba(0,20,60,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, hy - 60, w, 100)
    }

    function drawStars(ctx, w, h, t) {
      stars.forEach(s => {
        const twinkle = 0.6 + 0.4 * Math.sin(t * 1.5 + s.x * 10)
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,220,255,${s.a * twinkle})`
        ctx.fill()
      })
    }

    function drawMoon(ctx, w, h) {
      const mx = w * 0.82, my = h * 0.08
      const moonGrad = ctx.createRadialGradient(mx - 3, my - 3, 2, mx, my, 18)
      moonGrad.addColorStop(0, 'rgba(240,245,255,0.95)')
      moonGrad.addColorStop(0.6, 'rgba(220,235,255,0.85)')
      moonGrad.addColorStop(1, 'rgba(200,220,255,0)')
      ctx.beginPath()
      ctx.arc(mx, my, 18, 0, Math.PI * 2)
      ctx.fillStyle = moonGrad
      ctx.fill()
      // Moon glow
      const glowGrad = ctx.createRadialGradient(mx, my, 10, mx, my, 60)
      glowGrad.addColorStop(0, 'rgba(180,210,255,0.08)')
      glowGrad.addColorStop(1, 'rgba(180,210,255,0)')
      ctx.beginPath()
      ctx.arc(mx, my, 60, 0, Math.PI * 2)
      ctx.fillStyle = glowGrad
      ctx.fill()
    }

    function drawOcean(ctx, w, h, t) {
      // Deep ocean base
      const oceanGrad = ctx.createLinearGradient(0, h * 0.59, 0, h)
      oceanGrad.addColorStop(0, '#061828')
      oceanGrad.addColorStop(0.3, '#071e32')
      oceanGrad.addColorStop(0.7, '#051525')
      oceanGrad.addColorStop(1, '#030e18')
      ctx.fillStyle = oceanGrad
      ctx.fillRect(0, h * 0.59, w, h * 0.41)

      // Moon reflection on water
      const refX = w * 0.82
      const refGrad = ctx.createLinearGradient(refX - 30, h * 0.6, refX + 30, h)
      refGrad.addColorStop(0, 'rgba(200,220,255,0.12)')
      refGrad.addColorStop(1, 'rgba(200,220,255,0.02)')
      ctx.save()
      ctx.beginPath()
      ctx.rect(refX - 25, h * 0.6, 50, h * 0.4)
      ctx.clip()
      ctx.fillStyle = refGrad
      ctx.fillRect(refX - 25, h * 0.6, 50, h * 0.4)
      ctx.restore()

      // Wave layers - 4 layers of different frequencies
      const waveLayers = [
        { amp: 4, freq: 0.008, speed: 0.4, y: 0.61, alpha: 0.25, color: '40,100,180' },
        { amp: 3, freq: 0.012, speed: 0.6, y: 0.63, alpha: 0.2, color: '50,120,200' },
        { amp: 2.5, freq: 0.018, speed: 0.9, y: 0.66, alpha: 0.15, color: '60,140,210' },
        { amp: 2, freq: 0.025, speed: 1.2, y: 0.7, alpha: 0.12, color: '70,160,220' },
        { amp: 1.5, freq: 0.035, speed: 1.5, y: 0.75, alpha: 0.08, color: '80,170,230' },
      ]

      waveLayers.forEach(layer => {
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w; x += 3) {
          const wave1 = Math.sin(x * layer.freq + t * layer.speed) * layer.amp
          const wave2 = Math.sin(x * layer.freq * 1.7 + t * layer.speed * 1.3 + 1) * layer.amp * 0.5
          const y = h * layer.y + wave1 + wave2
          ctx.lineTo(x, y)
        }
        ctx.lineTo(w, h)
        ctx.closePath()
        ctx.fillStyle = `rgba(${layer.color},${layer.alpha})`
        ctx.fill()

        // Wave crests (foam)
        ctx.beginPath()
        for (let x = 0; x <= w; x += 3) {
          const wave1 = Math.sin(x * layer.freq + t * layer.speed) * layer.amp
          const wave2 = Math.sin(x * layer.freq * 1.7 + t * layer.speed * 1.3 + 1) * layer.amp * 0.5
          const y = h * layer.y + wave1 + wave2
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(150,200,255,${layer.alpha * 0.6})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      })
    }

    function drawRadarGrid(ctx, w, h, t) {
      // Subtle coordinate grid lines on ocean
      ctx.save()
      ctx.globalAlpha = 0.04
      ctx.strokeStyle = 'rgba(80,160,255,1)'
      ctx.lineWidth = 0.5
      const gridSpacing = 80
      for (let x = 0; x < w; x += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(x, h * 0.6)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = h * 0.6; y < h; y += gridSpacing * 0.6) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      ctx.restore()
    }

    function drawHorizonLine(ctx, w, h) {
      const hy = h * 0.605
      const grad = ctx.createLinearGradient(0, 0, w, 0)
      grad.addColorStop(0, 'rgba(40,100,180,0)')
      grad.addColorStop(0.2, 'rgba(60,130,220,0.4)')
      grad.addColorStop(0.5, 'rgba(80,160,240,0.6)')
      grad.addColorStop(0.8, 'rgba(60,130,220,0.4)')
      grad.addColorStop(1, 'rgba(40,100,180,0)')
      ctx.beginPath()
      ctx.moveTo(0, hy)
      ctx.lineTo(w, hy)
      ctx.strokeStyle = grad
      ctx.lineWidth = 1
      ctx.stroke()
    }

    function frame() {
      t += 0.016
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      // Sky
      drawSky(ctx, w, h)
      drawStars(ctx, w, h, t)
      drawMoon(ctx, w, h)
      drawHorizonGlow(ctx, w, h)

      // Ocean
      drawOcean(ctx, w, h, t)
      drawRadarGrid(ctx, w, h, t)
      drawHorizonLine(ctx, w, h)

      // Update and draw ships
      ships.forEach(ship => {
        ship.x -= ship.speed
        if (ship.x < -300 * ship.scale) ship.reset()
        ship.draw(ctx, t)
      })

      // Update and draw planes
      planes.forEach(plane => {
        if (plane.fromRight) {
          plane.x -= plane.speed
          if (plane.x < -200) plane.reset(false)
        } else {
          plane.x += plane.speed
          if (plane.x > w + 200) plane.reset(false)
        }
        plane.draw(ctx, t)
      })

      // Vignette overlay
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.8)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)

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
