'use client'

import { useEffect } from 'react'
import Script from 'next/script'

// Brand palette — each entry is [r, g, b] in 0-1, already dimmed
const PALETTE = [
  [0.486 * 0.20, 0.231 * 0.20, 0.929 * 0.20],  // #7c3aed  deep purple
  [0.655 * 0.20, 0.545 * 0.20, 0.980 * 0.20],  // #a78bfa  light purple
  [0.404 * 0.24, 0.910 * 0.24, 0.976 * 0.24],  // #67e8f9  cyan
  [0.78  * 0.16, 0.10  * 0.16, 0.88  * 0.16],  // hot magenta
  [1.00  * 0.16, 0.60  * 0.16, 0.00         ],  // #ff9900  aws orange
]
let _pidx = 0

function patchSim () {
  // @ts-expect-error — fluid sim globals
  if (typeof window.config !== 'undefined') {
    // @ts-expect-error
    const cfg = window.config
    cfg.BACK_COLOR            = { r: 10, g: 4, b: 25 }
    cfg.BLOOM                 = true
    cfg.SHADING               = true
    cfg.COLORFUL              = false
    cfg.DENSITY_DISSIPATION   = 1.1
    cfg.VELOCITY_DISSIPATION  = 0.22
    cfg.CURL                  = 28
    cfg.SPLAT_RADIUS          = 0.22
    cfg.SPLAT_FORCE           = 5000
  }

  // @ts-expect-error
  if (typeof window.generateColor === 'function') {
    // @ts-expect-error
    window.generateColor = function () {
      const c = PALETTE[_pidx % PALETTE.length]
      _pidx++
      return { r: c[0], g: c[1], b: c[2] }
    }
  }
}

export default function FluidCanvas () {
  // Re-apply patch whenever theme changes (light mode dims opacity via CSS, no sim change needed)
  useEffect(() => {
    // Patch after a short delay in case script loaded before this effect
    const t = setTimeout(patchSim, 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* The canvas MUST exist in the DOM before script.js runs */}
      <canvas id="canvas" />

      {/* Load fluid sim after page is interactive — it auto-grabs the first <canvas> */}
      <Script
        src="https://cdn.jsdelivr.net/gh/PavelDoGreat/WebGL-Fluid-Simulation@master/script.js"
        strategy="afterInteractive"
        onLoad={patchSim}
      />
    </>
  )
}
