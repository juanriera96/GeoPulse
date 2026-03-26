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

                          // Containers stack
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
                                                            ctx.beginPath()
                                                            ctx.rect(-68 + col * 11, -2 - (row + 1) * 8, 10, 2)
                                                            ctx.fillStyle = 'rgba(255,255,255,0.15)'
                                                            ctx.fill()
                                              }
                                  }

                          // Mast
                          ctx.beginPath()
                                  ctx.moveTo(15, -22)
                                  ctx.lineTo(15, -46)
                                  ctx.strokeStyle = '#344a5a'
                                  ctx.lineWidth = 2
                                  ctx.stroke()

                          // Radar
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

                // ---- PLANES (Boeing 747-400F Freighter) ----
                // Drawn from a true side-view profile: wide body, swept wings below fuselage,
                // 4 engines, prominent hump, large vertical fin with GeoPulse marking
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
                                              this.x = init ? Math.random() * canvas.width : canvas.width + 500
                                  } else {
                                              this.x = init ? Math.random() * canvas.width : -500
                                  }
                                  this.contrailPoints = []
                        }
                        draw(ctx, t) {
                                  const sc = this.scale
                                  const cx = this.x
                                  const cy = canvas.height * this.yRatio
                                  const dir = this.fromRight ? -1 : 1

                          // Store contrail points
                          this.contrailPoints.push({ x: cx, y: cy })
                                  if (this.contrailPoints.length > 120) this.contrailPoints.shift()

                          // Draw two parallel contrails (from the 4 engines - two pairs)
                          ctx.save()
                                  ctx.globalAlpha = this.alpha * 0.25
                                  const contrailOffsets = [-6 * sc, 6 * sc]
                                  contrailOffsets.forEach(offset => {
                                              for (let i = 1; i < this.contrailPoints.length; i++) {
                                                            const prog = i / this.contrailPoints.length
                                                            ctx.beginPath()
                                                            ctx.moveTo(this.contrailPoints[i - 1].x, this.contrailPoints[i - 1].y + offset)
                                                            ctx.lineTo(this.contrailPoints[i].x, this.contrailPoints[i].y + offset)
                                                            ctx.strokeStyle = `rgba(220,235,255,${prog * 0.35})`
                                                            ctx.lineWidth = prog * 5 * sc
                                                            ctx.stroke()
                                              }
                                  })
                                  ctx.restore()

                          // Draw Boeing 747 Freighter - TRUE SIDE PROFILE
                          ctx.save()
                                  ctx.globalAlpha = this.alpha
                                  ctx.translate(cx, cy)
                                  ctx.scale(dir * sc, sc)

                          // ========================================================
                          // FUSELAGE - long, wide-body tube (747 is very long)
                          // ========================================================
                          // Main fuselage body - elongated oval
                          ctx.beginPath()
                                  // Top arc of fuselage
                          ctx.moveTo(-65, 0)
                                  ctx.bezierCurveTo(-65, -11, -50, -14, -20, -14)
                                  ctx.bezierCurveTo(10, -14, 50, -14, 65, -12)
                                  ctx.bezierCurveTo(75, -10, 80, -6, 82, -2)
                                  // Nose tip
                          ctx.bezierCurveTo(84, 0, 84, 2, 82, 4)
                                  // Bottom of nose
                          ctx.bezierCurveTo(80, 6, 75, 8, 65, 8)
                                  ctx.bezierCurveTo(50, 10, 10, 10, -20, 10)
                                  ctx.bezierCurveTo(-50, 10, -65, 8, -65, 0)
                                  ctx.closePath()
                                  ctx.fillStyle = '#dce8f2'
                                  ctx.fill()
                                  ctx.strokeStyle = 'rgba(150,180,210,0.4)'
                                  ctx.lineWidth = 0.5
                                  ctx.stroke()

                          // 747 characteristic upper deck hump (forward of wing)
                          ctx.beginPath()
                                  ctx.moveTo(15, -14)
                                  ctx.bezierCurveTo(20, -14, 35, -20, 42, -20)
                                  ctx.bezierCurveTo(52, -20, 62, -17, 68, -14)
                                  ctx.lineTo(15, -14)
                                  ctx.closePath()
                                  ctx.fillStyle = '#ccd8e6'
                                  ctx.fill()

                          // Upper deck hump top line (smooth)
                          ctx.beginPath()
                                  ctx.moveTo(16, -14)
                                  ctx.bezierCurveTo(22, -20, 36, -21, 43, -21)
                                  ctx.bezierCurveTo(52, -21, 60, -18, 67, -14)
                                  ctx.strokeStyle = 'rgba(180,210,240,0.5)'
                                  ctx.lineWidth = 0.8
                                  ctx.stroke()

                          // Nose radome (darker nose cap)
                          ctx.beginPath()
                                  ctx.moveTo(78, -4)
                                  ctx.bezierCurveTo(80, -2, 84, 0, 82, 3)
                                  ctx.bezierCurveTo(80, 5, 77, 6, 74, 7)
                                  ctx.bezierCurveTo(70, 5, 70, -2, 74, -4)
                                  ctx.closePath()
                                  ctx.fillStyle = '#8a9eb0'
                                  ctx.fill()

                          // Cockpit windows (747 has distinctive angled cockpit windows)
                          ctx.fillStyle = 'rgba(80,160,230,0.8)'
                                  // Main cockpit windows
                          ctx.beginPath()
                                  ctx.rect(68, -10, 4, 5)
                                  ctx.fill()
                                  ctx.beginPath()
                                  ctx.rect(73, -9, 3, 4)
                                  ctx.fill()
                                  ctx.beginPath()
                                  ctx.rect(63, -10, 4, 5)
                                  ctx.fill()

                          // ---- AIRLINE LIVERY ----
                          // Dark blue belly stripe (lower half of fuselage)
                          ctx.beginPath()
                                  ctx.moveTo(-64, 4)
                                  ctx.bezierCurveTo(-50, 4, 10, 4, 65, 4)
                                  ctx.bezierCurveTo(72, 4, 78, 2, 80, 0)
                                  ctx.bezierCurveTo(78, 6, 72, 9, 65, 9)
                                  ctx.bezierCurveTo(10, 11, -50, 11, -64, 8)
                                  ctx.closePath()
                                  ctx.fillStyle = '#1a3a5c'
                                  ctx.fill()

                          // Thin accent line between white and blue
                          ctx.beginPath()
                                  ctx.moveTo(-64, 3)
                                  ctx.bezierCurveTo(-40, 3, 20, 3, 64, 3)
                                  ctx.strokeStyle = 'rgba(100,180,255,0.6)'
                                  ctx.lineWidth = 1
                                  ctx.stroke()

                          // Cabin windows (main deck - row of small rectangles)
                          ctx.fillStyle = 'rgba(160,210,255,0.55)'
                                  for (let w = 0; w < 16; w++) {
                                              ctx.beginPath()
                                              ctx.roundRect(-55 + w * 7.5, -8, 4, 5, 1)
                                              ctx.fill()
                                  }

                          // Cargo door outline (main deck cargo door - 747F has nose-loading door too)
                          ctx.beginPath()
                                  ctx.strokeStyle = 'rgba(120,160,200,0.5)'
                                  ctx.lineWidth = 0.8
                                  ctx.rect(25, -13, 18, 11)
                                  ctx.stroke()
                                  // Cargo door handle
                          ctx.beginPath()
                                  ctx.rect(29, -9, 10, 2)
                                  ctx.fillStyle = 'rgba(100,140,180,0.4)'
                                  ctx.fill()

                          // Service doors
                          ctx.strokeStyle = 'rgba(120,160,200,0.35)'
                                  ctx.lineWidth = 0.6
                                  ctx.beginPath(); ctx.rect(-30, -12, 8, 9); ctx.stroke()
                                  ctx.beginPath(); ctx.rect(50, -12, 8, 9); ctx.stroke()

                          // ========================================================
                          // WINGS - large swept wings, viewed from side (foreshortened)
                          // In side profile, the wing appears as a swept shape below fuselage
                          // ========================================================
                          // Main wing (right wing visible in side profile)
                          ctx.beginPath()
                                  ctx.moveTo(20, 8)        // Wing root front
                          ctx.lineTo(-5, 8)        // Wing root rear
                          ctx.lineTo(-42, 18)      // Wing tip trailing edge (swept)
                          ctx.lineTo(-28, 15)      // Wing tip (mid)
                          ctx.lineTo(5, 9)         // Wing root area
                          ctx.lineTo(22, 6)        // Wing leading edge root
                          ctx.closePath()
                                  ctx.fillStyle = '#bfcdd9'
                                  ctx.fill()
                                  ctx.strokeStyle = 'rgba(140,170,200,0.4)'
                                  ctx.lineWidth = 0.5
                                  ctx.stroke()

                          // Wing leading edge highlight
                          ctx.beginPath()
                                  ctx.moveTo(22, 6)
                                  ctx.lineTo(-26, 14)
                                  ctx.strokeStyle = 'rgba(210,225,240,0.6)'
                                  ctx.lineWidth = 1
                                  ctx.stroke()

                          // Winglet (upward curved tip)
                          ctx.beginPath()
                                  ctx.moveTo(-28, 15)
                                  ctx.bezierCurveTo(-34, 14, -38, 11, -38, 8)
                                  ctx.bezierCurveTo(-38, 5, -35, 4, -32, 5)
                                  ctx.lineTo(-28, 14)
                                  ctx.closePath()
                                  ctx.fillStyle = '#aab8c6'
                                  ctx.fill()

                          // ========================================================
                          // ENGINES - 4 CFM56 / GE engines under the wings
                          // In side view, we see them as pods below the wing
                          // ========================================================
                          // Engine 1 (inner, closest to fuselage) - most visible
                          ctx.beginPath()
                                  ctx.ellipse(-2, 16, 14, 5, 0, 0, Math.PI * 2)
                                  ctx.fillStyle = '#5a6e7e'
                                  ctx.fill()
                                  ctx.strokeStyle = 'rgba(100,140,170,0.5)'
                                  ctx.lineWidth = 0.8
                                  ctx.stroke()
                                  // Engine 1 intake (front face, darker)
                          ctx.beginPath()
                                  ctx.ellipse(10, 16, 5, 5, 0, 0, Math.PI * 2)
                                  ctx.fillStyle = '#2a3a48'
                                  ctx.fill()
                                  ctx.beginPath()
                                  ctx.arc(10, 16, 2.5, 0, Math.PI * 2)
                                  ctx.fillStyle = '#121c24'
                                  ctx.fill()
                                  // Engine 1 nacelle highlight
                          ctx.beginPath()
                                  ctx.moveTo(-4, 12)
                                  ctx.lineTo(8, 12)
                                  ctx.strokeStyle = 'rgba(200,220,240,0.4)'
                                  ctx.lineWidth = 1
                                  ctx.stroke()
                                  // Engine 1 pylon
                          ctx.beginPath()
                                  ctx.moveTo(2, 9)
                                  ctx.lineTo(1, 13)
                                  ctx.strokeStyle = '#6a7e8e'
                                  ctx.lineWidth = 2
                                  ctx.stroke()

                          // Engine 2 (outer) - slightly smaller / further away
                          ctx.beginPath()
                                  ctx.ellipse(-19, 18, 11, 4, 0, 0, Math.PI * 2)
                                  ctx.fillStyle = '#526070'
                                  ctx.fill()
                                  // Engine 2 intake
                          ctx.beginPath()
                                  ctx.ellipse(-9, 18, 4, 4, 0, 0, Math.PI * 2)
                                  ctx.fillStyle = '#283848'
                                  ctx.fill()
                                  ctx.beginPath()
                                  ctx.arc(-9, 18, 2, 0, Math.PI * 2)
                                  ctx.fillStyle = '#101820'
                                  ctx.fill()
                                  // Engine 2 nacelle highlight
                          ctx.beginPath()
                                  ctx.moveTo(-20, 15)
                                  ctx.lineTo(-10, 15)
                                  ctx.strokeStyle = 'rgba(200,220,240,0.35)'
                                  ctx.lineWidth = 0.8
                                  ctx.stroke()
                                  // Engine 2 pylon
                          ctx.beginPath()
                                  ctx.moveTo(-16, 14)
                                  ctx.lineTo(-15, 16)
                                  ctx.strokeStyle = '#6a7e8e'
                                  ctx.lineWidth = 1.5
                                  ctx.stroke()

                          // Engine exhaust glow (behind engines, faint)
                          ctx.globalAlpha = this.alpha * 0.12
                                  const exhaustPositions = [[-16, 16], [-29, 18]]
                                  exhaustPositions.forEach(([ex, ey]) => {
                                              const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 10)
                                              grad.addColorStop(0, 'rgba(255,200,80,0.7)')
                                              grad.addColorStop(0.5, 'rgba(255,120,30,0.3)')
                                              grad.addColorStop(1, 'rgba(255,60,0,0)')
                                              ctx.beginPath()
                                              ctx.ellipse(ex - 8, ey, 12, 4, 0, 0, Math.PI * 2)
                                              ctx.fillStyle = grad
                                              ctx.fill()
                                  })
                                  ctx.globalAlpha = this.alpha

                          // ========================================================
                          // TAIL ASSEMBLY
                          // ========================================================
                          // Horizontal stabilizer (rear, at the tail)
                          ctx.beginPath()
                                  ctx.moveTo(-58, 0)       // Root front
                          ctx.lineTo(-62, 0)       // Root rear
                          ctx.lineTo(-72, 8)       // Tip (sweep down)
                          ctx.lineTo(-68, 9)       // Tip trailing
                          ctx.lineTo(-58, 5)       // Root lower
                          ctx.closePath()
                                  ctx.fillStyle = '#b8c8d6'
                                  ctx.fill()

                          // Horizontal stabilizer highlight
                          ctx.beginPath()
                                  ctx.moveTo(-58, 0)
                                  ctx.lineTo(-70, 8)
                                  ctx.strokeStyle = 'rgba(200,220,235,0.5)'
                                  ctx.lineWidth = 0.8
                                  ctx.stroke()

                          // Vertical stabilizer (tall fin) - 747 has a tall swept fin
                          ctx.beginPath()
                                  ctx.moveTo(-60, 0)       // Base front
                          ctx.lineTo(-65, 0)       // Base rear
                          ctx.lineTo(-70, -28)     // Tip
                          ctx.lineTo(-60, -24)     // Leading edge upper
                          ctx.lineTo(-57, -10)     // Mid
                          ctx.closePath()
                                  ctx.fillStyle = '#b0c0d0'
                                  ctx.fill()
                                  ctx.strokeStyle = 'rgba(140,170,200,0.3)'
                                  ctx.lineWidth = 0.5
                                  ctx.stroke()

                          // Vertical fin leading edge highlight
                          ctx.beginPath()
                                  ctx.moveTo(-60, 0)
                                  ctx.lineTo(-62, -24)
                                  ctx.strokeStyle = 'rgba(210,225,240,0.5)'
                                  ctx.lineWidth = 1
                                  ctx.stroke()

                          // Fin logo / airline marking (GeoPulse colors)
                          ctx.beginPath()
                                  ctx.moveTo(-62, -5)
                                  ctx.lineTo(-67, -5)
                                  ctx.lineTo(-68, -20)
                                  ctx.lineTo(-63, -18)
                                  ctx.closePath()
                                  ctx.fillStyle = '#1a3a5c'  // Navy blue (matching livery)
                          ctx.fill()

                          // "GP" text on tail fin (small)
                          ctx.fillStyle = 'rgba(255,255,255,0.7)'
                                  ctx.font = 'bold 5px Arial'
                                  ctx.textAlign = 'center'
                                  ctx.fillText('GP', -65, -10)

                          // APU exhaust (small nozzle at rear of fuselage)
                          ctx.beginPath()
                                  ctx.rect(-65, 2, 4, 4)
                                  ctx.fillStyle = '#6a7a8a'
                                  ctx.fill()

                          // ========================================================
                          // NAVIGATION LIGHTS
                          // ========================================================
                          // Red light (left/port - on winglet)
                          ctx.beginPath()
                                  ctx.arc(-36, 5, 1.5, 0, Math.PI * 2)
                                  ctx.fillStyle = `rgba(255,50,50,${0.6 + 0.4 * Math.sin(t * 3)})`
                                  ctx.fill()

                          // White strobe (belly)
                          ctx.beginPath()
                                  ctx.arc(0, 9, 1.2, 0, Math.PI * 2)
                                  ctx.fillStyle = `rgba(255,255,255,${Math.sin(t * 5) > 0.8 ? 0.95 : 0.1})`
                                  ctx.fill()

                          // Beacon light (top of fuselage)
                          ctx.beginPath()
                                  ctx.arc(10, -14, 1.2, 0, Math.PI * 2)
                                  ctx.fillStyle = `rgba(255,60,60,${Math.sin(t * 2.5) > 0.7 ? 0.9 : 0.15})`
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
                        const glowGrad = ctx.createRadialGradient(mx, my, 10, mx, my, 60)
                        glowGrad.addColorStop(0, 'rgba(180,210,255,0.08)')
                        glowGrad.addColorStop(1, 'rgba(180,210,255,0)')
                        ctx.beginPath()
                        ctx.arc(mx, my, 60, 0, Math.PI * 2)
                        ctx.fillStyle = glowGrad
                        ctx.fill()
                }

                function drawOcean(ctx, w, h, t) {
                        const oceanGrad = ctx.createLinearGradient(0, h * 0.59, 0, h)
                        oceanGrad.addColorStop(0, '#061828')
                        oceanGrad.addColorStop(0.3, '#071e32')
                        oceanGrad.addColorStop(0.7, '#051525')
                        oceanGrad.addColorStop(1, '#030e18')
                        ctx.fillStyle = oceanGrad
                        ctx.fillRect(0, h * 0.59, w, h * 0.41)

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

          drawSky(ctx, w, h)
                        drawStars(ctx, w, h, t)
                        drawMoon(ctx, w, h)
                        drawHorizonGlow(ctx, w, h)
                        drawOcean(ctx, w, h, t)
                        drawRadarGrid(ctx, w, h, t)
                        drawHorizonLine(ctx, w, h)

          ships.forEach(ship => {
                    ship.x -= ship.speed
                    if (ship.x < -300 * ship.scale) ship.reset()
                    ship.draw(ctx, t)
          })

          planes.forEach(plane => {
                    if (plane.fromRight) {
                                plane.x -= plane.speed
                                if (plane.x < -300) plane.reset(false)
                    } else {
                                plane.x += plane.speed
                                if (plane.x > w + 300) plane.reset(false)
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
