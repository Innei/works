import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useEffect, useState } from 'react'

import { audio } from '../audio/engine'
import { live } from '../store'
import { Fluid } from './fluid/Fluid'

function Driver() {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    if (!live.reduced) live.time += dt
    live.audio += (audio.level() - live.audio) * Math.min(1, dt * 12)
  })
  return null
}

export default function Stage({ onContextLost }: { onContextLost: () => void }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return (
    <div aria-hidden className="fixed inset-0">
      <Canvas
        dpr={[1, 1.5]}
        frameloop={visible ? 'always' : 'never'}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', onContextLost, { once: true })}
      >
        <Driver />
        <Fluid />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.25} />
          <Vignette offset={0.2} darkness={0.7} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
