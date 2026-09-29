import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, SRGBColorSpace, TextureLoader, Vector2, Vector3, Vector4, type Texture } from 'three'

import { audio } from '../../audio/engine'
import { sections } from '../../data/projects'
import { cardRect, focusFor } from '../../lib/layout'
import { blendAt, mixResolved, resolve } from '../../lib/params'
import { live } from '../../store'
import { Shader } from '../Shader'
import { compositeFragment, compositeVertex } from './composite'
import { frameFragment, frameGeometry, frameVertex } from './frame'
import { FluidSim } from './sim'

const POINTER_FORCE = 6000
const SCROLL_FORCE = 2500

const loader = new TextureLoader()
const shotCache = new Map<string, Texture>()

function shotFor(index: number) {
  const section = sections[index]
  const src = 'shot' in section ? section.shot : undefined
  if (!src) return undefined
  let tex = shotCache.get(src)
  if (!tex) {
    tex = loader.load(src)
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = 4
    shotCache.set(src, tex)
  }
  const img = tex.image as HTMLImageElement | undefined
  return img?.width ? { tex, aspect: img.width / img.height } : undefined
}

const sideOf = (index: number) => {
  const section = sections[index]
  return 'side' in section ? section.side : undefined
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function Fluid() {
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const sim = useMemo(() => (live.mobile ? new FluidSim(64, 256) : new FluidSim(128, 512)), [])
  useEffect(() => () => sim.dispose(), [sim])
  const frame = useMemo(() => frameGeometry(live.mobile ? 1100 : 2600), [])
  useEffect(() => () => frame.dispose(), [frame])
  const resolved = useMemo(() => sections.map((s) => resolve(s.fluid)), [])
  useEffect(() => sections.forEach((_, i) => shotFor(i)), [])
  const uniforms = useMemo(
    () => ({
      uDye: { value: null as Texture | null },
      uVelocity: { value: null as Texture | null },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uFocus: { value: new Vector2(0.68, 0.5) },
      uLight: { value: new Vector2(0.3, 0.5) },
      uP0: { value: new Vector3() },
      uP1: { value: new Vector3() },
      uP2: { value: new Vector3() },
      uModes: { value: [1, 0, 0, 0] },
      uWarp: { value: 1 },
      uSpeed: { value: 1 },
      uScale: { value: 1 },
      uDensity: { value: 0.6 },
      uGrain: { value: 0 },
      uSaturation: { value: 1 },
      uStretch: { value: 1 },
      uKick: { value: 0 },
      uHat: { value: 0 },
      uAudio: { value: 0 },
      uShotA: { value: null as Texture | null },
      uShotB: { value: null as Texture | null },
      uCardA: { value: new Vector4() },
      uCardB: { value: new Vector4() },
      uRevealA: { value: 0 },
      uRevealB: { value: 0 },
      uStir: { value: 0 },
      uFocusA: { value: new Vector2(0.5, 0.5) },
      uFocusB: { value: new Vector2(0.5, 0.5) },
      uHasA: { value: 0 },
      uHasB: { value: 0 },
      uT: { value: 0 },
      uPixel: { value: 1.5 },
    }),
    [],
  )
  const prev = useRef({ x: live.pointerX, y: live.pointerY, progress: live.progress })
  const pulse = useRef({ kick: 0, hat: 0 })
  const hover = useRef({ index: -1, mix: 0 })
  const reveals = useRef(sections.map(() => 0))
  const stir = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const aspect = size.width / size.height
    const wide = size.width >= 768
    sim.aspect = aspect

    const { from, to, t } = blendAt(live.progress, sections.length)
    let p = mixResolved(resolved[from], resolved[to], t)
    const h = hover.current
    const wantHover = live.hover > 0 && live.progress < 0.5
    if (wantHover) h.index = live.hover
    h.mix += ((wantHover ? 0.65 : 0) - h.mix) * Math.min(1, dt * 5)
    if (h.index > 0 && h.mix > 0.001) p = mixResolved(p, resolved[h.index], h.mix)
    const u = uniforms
    const fa = focusFor(sideOf(from), wide)
    const fb = focusFor(sideOf(to), wide)
    u.uFocus.value.set(fa[0] + (fb[0] - fa[0]) * t, fa[1] + (fb[1] - fa[1]) * t)
    const [cx, cy] = [u.uFocus.value.x, u.uFocus.value.y]

    const r = reveals.current
    for (let i = 0; i < r.length; i++) {
      const target = i === from ? 1 - smoothstep(0, 0.55, t) : i === to ? smoothstep(0.45, 1, t) : 0
      r[i] = !shotFor(i) ? 0 : live.reduced ? target : r[i] + (target - r[i]) * Math.min(1, dt * (target > r[i] ? 3.5 : 8))
    }
    const shotA = shotFor(from)
    const shotB = to !== from ? shotFor(to) : undefined
    u.uShotA.value = shotA?.tex ?? null
    u.uRevealA.value = shotA ? r[from] : 0
    if (shotA) u.uCardA.value.set(...cardRect(shotA.aspect, aspect, fa, wide))
    u.uFocusA.value.set(fa[0], fa[1])
    u.uFocusB.value.set(fb[0], fb[1])
    u.uHasA.value = shotA ? 1 : 0
    u.uHasB.value = to === from ? u.uHasA.value : shotB ? 1 : 0
    u.uT.value = to === from ? 0 : t
    u.uPixel.value = gl.getPixelRatio() * 1.6
    if (to === from && shotA) u.uCardB.value.copy(u.uCardA.value)
    u.uShotB.value = shotB?.tex ?? null
    u.uRevealB.value = shotB ? r[to] : 0
    if (shotB) u.uCardB.value.set(...cardRect(shotB.aspect, aspect, fb, wide))

    for (const beat of audio.drainBeats()) {
      if (beat.kind === 'kick') {
        pulse.current.kick = 1
        if (!live.reduced) {
          const a = Math.random() * Math.PI * 2
          const force = 500 + Math.random() * 400
          sim.splat(gl, cx + (Math.random() - 0.5) * 0.25, cy + (Math.random() - 0.5) * 0.25, Math.cos(a) * force, Math.sin(a) * force,
            new Vector3(p.palette[6], p.palette[7], p.palette[8]).multiplyScalar(0.18), 0.004)
        }
      } else if (beat.kind === 'hat') pulse.current.hat = 1
      else pulse.current.kick = Math.max(pulse.current.kick, 0.5)
    }
    pulse.current.kick *= Math.exp(-dt * 7)
    pulse.current.hat *= Math.exp(-dt * 14)

    const last = prev.current
    if (!live.reduced) {
      const clamp = (v: number) => Math.max(-0.05, Math.min(0.05, v))
      const dx = clamp((live.pointerX - last.x) / 2)
      const dy = clamp((live.pointerY - last.y) / 2)
      if (Math.abs(dx) + Math.abs(dy) > 0.0005) {
        stir.current = Math.min(1, stir.current + (Math.abs(dx) + Math.abs(dy)) * 20)
        sim.splat(gl, (live.pointerX + 1) / 2, (live.pointerY + 1) / 2, dx * POINTER_FORCE * aspect, dy * POINTER_FORCE,
          new Vector3(p.palette[3], p.palette[4], p.palette[5]).multiplyScalar(0.12))
      }
      const ds = live.progress - last.progress
      if (Math.abs(ds) > 0.001) sim.splat(gl, cx, cy - 0.2, 0, Math.max(-1, Math.min(1, ds * 8)) * SCROLL_FORCE, new Vector3(), 0.02)
    }
    prev.current = { x: live.pointerX, y: live.pointerY, progress: live.progress }
    stir.current *= Math.exp(-dt * 3)

    sim.step(gl, live.reduced ? 0 : dt, p.dissipation)

    u.uDye.value = sim.dyeTexture
    u.uVelocity.value = sim.velocityTexture
    u.uTime.value = live.time
    u.uAspect.value = aspect
    u.uLight.value.set(live.pointerX * 0.6, live.pointerY * 0.6 + 0.3)
    u.uP0.value.fromArray(p.palette, 0)
    u.uP1.value.fromArray(p.palette, 3)
    u.uP2.value.fromArray(p.palette, 6)
    u.uModes.value = p.modes
    u.uWarp.value = p.warp
    u.uSpeed.value = p.speed
    u.uScale.value = p.scale
    u.uDensity.value = p.density
    u.uGrain.value = p.grain
    u.uSaturation.value = p.saturation
    u.uStretch.value = p.stretch
    u.uKick.value = pulse.current.kick
    u.uHat.value = pulse.current.hat
    u.uAudio.value = live.audio
    u.uStir.value = stir.current
  })

  return (
    <>
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <Shader vertexShader={compositeVertex} fragmentShader={compositeFragment} uniforms={uniforms} depthTest={false} depthWrite={false} />
    </mesh>
    <points geometry={frame} frustumCulled={false} renderOrder={1}>
      <Shader
        vertexShader={frameVertex}
        fragmentShader={frameFragment}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
    </>
  )
}
