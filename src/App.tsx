import { MotionConfig } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'

import { audio } from './audio/engine'
import { grooves } from './data/grooves'
import { projects, sectionCount, sections } from './data/projects'
import { activeIndex, sceneWeight } from './lib/progress'
import { live, scrollToSection, useUI } from './store'
import { AudioToggle } from './ui/AudioToggle'
import { GLBoundary } from './ui/GLBoundary'
import { DotNav } from './ui/DotNav'
import { Overview } from './ui/Overview'
import { ProjectSection } from './ui/ProjectSection'

const Stage = lazy(() => import('./gl/Stage'))

const supportsWebGL = () => {
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    const ok = !!gl && !!(gl.getExtension('EXT_color_buffer_half_float') || gl.getExtension('EXT_color_buffer_float'))
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return ok
  } catch {
    return false
  }
}

function Fallback() {
  const active = useUI((s) => s.active)
  const { color } = sections[active]
  return (
    <div
      aria-hidden
      className="fixed inset-0 transition-[background] duration-1000"
      style={{ background: `radial-gradient(60% 60% at 70% 45%, ${color}33, transparent 70%), #050507` }}
    />
  )
}

const NEXT = new Set(['ArrowDown', 'PageDown', 'j'])
const PREV = new Set(['ArrowUp', 'PageUp', 'k'])

export default function App() {
  const [webgl, setWebgl] = useState(supportsWebGL)
  const scroller = useRef<HTMLElement>(null)
  const scrimLeft = useRef<HTMLDivElement>(null)
  const scrimRight = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const onScroll = () => {
      live.progress = el.scrollTop / el.clientHeight
      let left = 0
      let right = 0
      sections.forEach((section, i) => {
        if (!('side' in section)) return
        if (section.side === 'left') left += sceneWeight(live.progress, i)
        else right += sceneWeight(live.progress, i)
      })
      if (scrimLeft.current) scrimLeft.current.style.opacity = String(left)
      if (scrimRight.current) scrimRight.current.style.opacity = String(right)
      const next = activeIndex(live.progress, sectionCount)
      if (next !== useUI.getState().active) useUI.setState({ active: next })
    }
    const onPointer = (e: PointerEvent) => {
      live.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      live.pointerY = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    let target: number | null = null
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest('input, textarea')) return
      const from = target ?? useUI.getState().active
      const to = NEXT.has(e.key) ? from + 1 : PREV.has(e.key) ? from - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? sectionCount - 1 : null
      if (to === null) return
      e.preventDefault()
      const next = Math.max(0, Math.min(sectionCount - 1, to))
      target = next === useUI.getState().active ? null : next
      scrollToSection(next)
    }
    const unsubscribe = useUI.subscribe((s, prev) => {
      if (s.active === prev.active) return
      if (s.active === target) target = null
      audio.setGroove(grooves[sections[s.active].id])
    })
    audio.setGroove(grooves[sections[useUI.getState().active].id])
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
    const onMotion = () => (live.reduced = motionQuery.matches)
    motionQuery.addEventListener('change', onMotion)
    const resetTarget = () => (target = null)
    el.addEventListener('wheel', resetTarget, { passive: true })
    el.addEventListener('touchstart', resetTarget, { passive: true })
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      unsubscribe()
      motionQuery.removeEventListener('change', onMotion)
      el.removeEventListener('wheel', resetTarget)
      el.removeEventListener('touchstart', resetTarget)
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      {webgl ? (
        <GLBoundary fallback={<Fallback />}>
          <Suspense fallback={<Fallback />}>
            <Stage onContextLost={() => setWebgl(false)} />
          </Suspense>
        </GLBoundary>
      ) : (
        <Fallback />
      )}

      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-16 lg:px-24">
        <a href="#" onClick={(e) => (e.preventDefault(), scrollToSection(0))} className="pointer-events-auto flex items-baseline gap-2">
          <span className="font-display text-2xl leading-none">Innei</span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-white/40">2026</span>
        </a>
        <nav className="pointer-events-auto flex gap-5 font-mono text-[11px] tracking-[0.16em] text-white/55 uppercase">
          <a href="https://innei.in" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
            Blog
          </a>
          <a href="https://github.com/Innei" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
            GitHub
          </a>
        </nav>
      </header>

      <div
        ref={scrimLeft}
        aria-hidden
        className="pointer-events-none fixed inset-y-0 left-0 z-10 hidden w-[55%] bg-gradient-to-r from-ink/85 via-ink/50 to-transparent opacity-0 md:block"
      />
      <div
        ref={scrimRight}
        aria-hidden
        className="pointer-events-none fixed inset-y-0 right-0 z-10 hidden w-[55%] bg-gradient-to-l from-ink/85 via-ink/50 to-transparent opacity-0 md:block"
      />

      <main id="scroller" ref={scroller} className="relative z-10 h-svh snap-y snap-mandatory overflow-y-auto overscroll-none">
        <Overview />
        {projects.map((p, i) => (
          <ProjectSection key={p.id} project={p} index={i + 1} total={projects.length} />
        ))}
      </main>

      <DotNav />
      <AudioToggle />
    </MotionConfig>
  )
}
