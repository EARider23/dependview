import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function GlowingDots({ density = 1, dotSize = null }) {
  const containerRef = useRef(null)
  const dotsRef = useRef([])
  const dotCentersRef = useRef([])
  const inertiaAvailableRef = useRef(false)
  const dotPxRef = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      console.log('❌ Container not found')
      return
    }

    // Try to dynamically import and register the InertiaPlugin.
    // If it's not available (most users don't have the paid plugin),
    // we'll fall back to standard tweens that emulate the effect.
    (async () => {
      try {
        const mod = await import('gsap/InertiaPlugin')
        const InertiaPlugin = mod.default || mod.InertiaPlugin || mod
        gsap.registerPlugin(InertiaPlugin)
        inertiaAvailableRef.current = true
        console.log('✅ InertiaPlugin registered')
      } catch (err) {
        inertiaAvailableRef.current = false
        console.warn('⚠️ InertiaPlugin not available — using fallback tweens')
      }

      console.log('✅ Container found, building grid...')

      // Interaction & layout parameters
      const colors = { base: '#245E51', active: '#A8FF51' }
      const threshold = 150
      const speedThreshold = 100
      const shockRadius = 250
      const shockPower = 5
      const maxSpeed = 5000
      const centerHole = true
      const edgeInset = 5 // pixels inset from each card edge
      const baseOpacity = 0.10
      const activeOpacity = 0.2

      const maxDots = 900 // hard cap to avoid heavy DOM on large screens

      function buildGrid() {
        container.innerHTML = ""
        dotsRef.current = []
        dotCentersRef.current = []

        const style = getComputedStyle(container)
        const baseDotPx = parseFloat(style.fontSize)
        const contW = container.clientWidth
        const contH = container.clientHeight

        // Scale dot size on small viewports to reduce density (fewer dots)
        let scaleUp = 1
        if (contW < 480) scaleUp = 1.6
        else if (contW < 768) scaleUp = 1.3
        // Allow an explicit `dotSize` prop (in px). Otherwise compute from font-size.
        const computedDot = Math.max(1, Math.round(baseDotPx * scaleUp))
        const dotPx = dotSize ? Math.max(1, Math.round(dotSize)) : computedDot
        const gapPx = Math.round(dotPx * 2)

        // Effective inner area after edge inset so dots don't touch rounded corners
        const effW = Math.max(0, contW - edgeInset * 2)
        const effH = Math.max(0, contH - edgeInset * 2)

        // Compute full grid then apply density multiplier (0..1), with a hard cap
        const colsFull = Math.floor((effW + gapPx) / (dotPx + gapPx))
        const rowsFull = Math.floor((effH + gapPx) / (dotPx + gapPx))
        const d = Math.max(0.05, Math.min(1, density))

        // Apply density then scale down if exceeding maxDots
        let cols = Math.max(1, Math.floor(colsFull * d))
        let rows = Math.max(1, Math.floor(rowsFull * d))
        const totalFull = cols * rows
        if (totalFull > maxDots) {
          const scale = Math.sqrt(maxDots / totalFull)
          cols = Math.max(1, Math.floor(cols * scale))
          rows = Math.max(1, Math.floor(rows * scale))
        }
        const total = cols * rows

        console.log(`📊 Building grid: ${cols} cols × ${rows} rows = ${total} dots`)

        const holeCols = centerHole ? (cols % 2 === 0 ? 4 : 5) : 0
        const holeRows = centerHole ? (rows % 2 === 0 ? 4 : 5) : 0
        const startCol = (cols - holeCols) / 2
        const startRow = (rows - holeRows) / 2

        // compute used width/height and offsets so grid fills container evenly
        const usedW = cols * dotPx + Math.max(0, cols - 1) * gapPx
        const usedH = rows * dotPx + Math.max(0, rows - 1) * gapPx
        const offsetX = edgeInset + Math.max(0, (effW - usedW) / 2)
        const offsetY = edgeInset + Math.max(0, (effH - usedH) / 2)

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const isHole = centerHole &&
              r >= startRow && r < startRow + holeRows &&
              c >= startCol && c < startCol + holeCols

            const d = document.createElement('div')
            d.className = 'glowing-dot'
            d.style.position = 'absolute'
            d.style.width = `${dotPx}px`
            d.style.height = `${dotPx}px`
            const left = offsetX + c * (dotPx + gapPx)
            const top = offsetY + r * (dotPx + gapPx)
            d.style.left = `${left}px`
            d.style.top = `${top}px`

            if (isHole) {
              d.style.visibility = 'hidden'
              d._isHole = true
            } else {
              gsap.set(d, { x: 0, y: 0, backgroundColor: colors.base, opacity: baseOpacity })
              d._inertiaApplied = false
            }

            container.appendChild(d)
            dotsRef.current.push(d)
          }
        }

        // persist the computed dot size for use by pointer handlers
        dotPxRef.current = dotPx

        requestAnimationFrame(() => {
          const rect = container.getBoundingClientRect()
          dotCentersRef.current = dotsRef.current
            .filter(d => !d._isHole)
            .map(d => {
              const left = parseFloat(d.style.left || 0)
              const top = parseFloat(d.style.top || 0)
              return {
                el: d,
                x: rect.left + window.scrollX + left + dotPxRef.current / 2,
                y: rect.top + window.scrollY + top + dotPxRef.current / 2,
                // also keep local coordinates for clamping pushes later
                localLeft: left,
                localTop: top
              }
            })
        })
      }

      buildGrid()

      let lastTime = 0, lastX = 0, lastY = 0

      const handlePointerMove = (e) => {
        const now = performance.now()
        const dt = now - lastTime || 16
        let dx = e.pageX - lastX
        let dy = e.pageY - lastY
        let vx = dx / dt * 1000
        let vy = dy / dt * 1000
        let speed = Math.hypot(vx, vy)

        if (speed > maxSpeed) {
          const scale = maxSpeed / speed
          vx *= scale
          vy *= scale
          speed = maxSpeed
        }

        lastTime = now
        lastX = e.pageX
        lastY = e.pageY

        requestAnimationFrame(() => {
          const rect = container.getBoundingClientRect()
          const safeLeftLocal = edgeInset
          const safeTopLocal = edgeInset
          const safeRightLocal = rect.width - edgeInset
          const safeBottomLocal = rect.height - edgeInset

          dotCentersRef.current.forEach(({ el, x, y, localLeft, localTop }) => {
            const dist = Math.hypot(x - e.pageX, y - e.pageY)
            const t = Math.max(0, 1 - dist / threshold)
            const col = gsap.utils.interpolate(colors.base, colors.active, t)
            const opacityVal = baseOpacity + (activeOpacity - baseOpacity) * t
            gsap.set(el, { backgroundColor: col, opacity: opacityVal })

            if (speed > speedThreshold && dist < threshold && !el._inertiaApplied) {
              el._inertiaApplied = true
              // desired push in pixels (global coords)
              const desiredPushX = (x - e.pageX) + vx * 0.005
              const desiredPushY = (y - e.pageY) + vy * 0.005

              // convert allowed push range to local coordinates relative to container
              const dotPxLocal = dotPxRef.current || 1
              const centerLocalX = localLeft + dotPxLocal / 2
              const centerLocalY = localTop + dotPxLocal / 2
              const minPushX = (safeLeftLocal + dotPxLocal / 2) - centerLocalX
              const maxPushX = (safeRightLocal - dotPxLocal / 2) - centerLocalX
              const minPushY = (safeTopLocal + dotPxLocal / 2) - centerLocalY
              const maxPushY = (safeBottomLocal - dotPxLocal / 2) - centerLocalY

              const pushX = Math.max(minPushX, Math.min(maxPushX, desiredPushX))
              const pushY = Math.max(minPushY, Math.min(maxPushY, desiredPushY))

              if (inertiaAvailableRef.current) {
                gsap.to(el, {
                  inertia: { x: pushX, y: pushY, resistance: 750 },
                  onComplete() {
                    gsap.to(el, {
                      x: 0,
                      y: 0,
                      duration: 1.5,
                      ease: 'elastic.out(1,0.75)'
                    })
                    el._inertiaApplied = false
                  }
                })
              } else {
                gsap.to(el, {
                  x: pushX,
                  y: pushY,
                  duration: 1.2,
                  ease: 'power4.out',
                  onComplete() {
                    gsap.to(el, {
                      x: 0,
                      y: 0,
                      duration: 1.5,
                      ease: 'elastic.out(1,0.75)'
                    })
                    el._inertiaApplied = false
                  }
                })
              }
            }
          })
        })
      }

      const handlePointerDown = (e) => {
        dotCentersRef.current.forEach(({ el, x, y }) => {
          const dist = Math.hypot(x - e.pageX, y - e.pageY)
          if (dist < shockRadius && !el._inertiaApplied) {
            el._inertiaApplied = true
            const falloff = Math.max(0, 1 - dist / shockRadius)

            // desired push in global coords
            const desiredPushX = (x - e.pageX) * shockPower * falloff
            const desiredPushY = (y - e.pageY) * shockPower * falloff

            // clamp to safe region (compute local center again)
            const rect = container.getBoundingClientRect()
            const leftLocal = parseFloat(el.style.left || 0)
            const topLocal = parseFloat(el.style.top || 0)
            const dotPxLocal = dotPxRef.current || 1
            const centerLocalX = leftLocal + dotPxLocal / 2
            const centerLocalY = topLocal + dotPxLocal / 2
            const minPushX = (edgeInset + dotPxLocal / 2) - centerLocalX
            const maxPushX = (rect.width - edgeInset - dotPxLocal / 2) - centerLocalX
            const minPushY = (edgeInset + dotPxLocal / 2) - centerLocalY
            const maxPushY = (rect.height - edgeInset - dotPxLocal / 2) - centerLocalY

            const pushX = Math.max(minPushX, Math.min(maxPushX, desiredPushX))
            const pushY = Math.max(minPushY, Math.min(maxPushY, desiredPushY))

            if (inertiaAvailableRef.current) {
              gsap.to(el, {
                inertia: { x: pushX, y: pushY, resistance: 750 },
                onComplete() {
                  gsap.to(el, {
                    x: 0,
                    y: 0,
                    duration: 1.5,
                    ease: 'elastic.out(1,0.75)'
                  })
                  el._inertiaApplied = false
                }
              })
            } else {
              gsap.to(el, {
                x: pushX,
                y: pushY,
                duration: 1.2,
                ease: 'power4.out',
                onComplete() {
                  gsap.to(el, {
                    x: 0,
                    y: 0,
                    duration: 1.5,
                    ease: 'elastic.out(1,0.75)'
                  })
                  el._inertiaApplied = false
                }
              })
            }
          }
        })
      }

      // debounce resize to avoid rebuilding too often
      let resizeTimer = null
      const handleResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          buildGrid()
          resizeTimer = null
        }, 120)
      }

      // Attach pointer listeners to the container's parent so the container
      // can remain `pointer-events: none` (so buttons inside the card stay clickable)
      const targetEl = container.parentElement || window
      targetEl.addEventListener('pointermove', handlePointerMove)
      targetEl.addEventListener('pointerdown', handlePointerDown)
      window.addEventListener('resize', handleResize)

      return () => {
        try {
          const t = container.parentElement || window
          t.removeEventListener('pointermove', handlePointerMove)
          t.removeEventListener('pointerdown', handlePointerDown)
        } catch (err) {}
        window.removeEventListener('resize', handleResize)
      }
    })()
  }, [])

    return (
    <div
      ref={containerRef}
      className="absolute pointer-events-none"
      style={{
        fontSize: '0.20vw',
        top: '0px',
        left: '0px',
        right: '0px',
        bottom: '0px',
        zIndex: 0
      }}
    />
  )
}
