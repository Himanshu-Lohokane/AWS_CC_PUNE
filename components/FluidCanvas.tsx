'use client'

import Script from 'next/script'

export default function FluidCanvas () {
  return (
    <>
      <canvas id="canvas" />
      <Script
        src="/fluid-sim.js"
        strategy="afterInteractive"
      />
    </>
  )
}
