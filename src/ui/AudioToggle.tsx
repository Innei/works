import { useEffect, useRef } from 'react'

import { audio } from '../audio/engine'
import { useUI } from '../store'

const BARS = 5
const KEY = 'portfolio:sound'

const readPref = () => {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch {
    return false
  }
}

const writePref = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* storage blocked */
  }
}

const setSound = (on: boolean) => {
  useUI.setState({ audioOn: on })
  writePref(on)
  if (on) void audio.start()
  else audio.stop()
}

export function AudioToggle() {
  const on = useUI((s) => s.audioOn)
  const button = useRef<HTMLButtonElement>(null)
  const bars = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    if (!readPref()) return
    const resume = (e: Event) => {
      if (button.current?.contains(e.target as Node)) return
      if (!readPref()) return cleanup()
      if (!useUI.getState().audioOn) setSound(true)
      cleanup()
    }
    const cleanup = () => {
      window.removeEventListener('click', resume)
      window.removeEventListener('keydown', resume)
    }
    window.addEventListener('click', resume)
    window.addEventListener('keydown', resume)
    return cleanup
  }, [])

  useEffect(() => {
    if (!on) {
      bars.current.forEach((el) => el && (el.style.transform = 'scaleY(0.18)'))
      return
    }
    let raf = 0
    const tick = () => {
      const levels = audio.bands(BARS)
      bars.current.forEach((el, i) => {
        if (el) el.style.transform = `scaleY(${0.18 + Math.min(1, levels[i] * 1.6) * 0.82})`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on])

  return (
    <button
      ref={button}
      type="button"
      aria-pressed={on}
      onClick={() => setSound(!on)}
      className="fixed right-4 bottom-4 z-20 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-2 pr-4 pl-3.5 backdrop-blur-md transition-colors hover:border-white/25 md:right-6 md:bottom-6"
    >
      <span aria-hidden className="flex h-3.5 items-center gap-[3px]">
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            ref={(el) => {
              bars.current[i] = el
            }}
            className="block h-full w-[2px] origin-center rounded-full bg-white/80 transition-transform duration-100"
            style={{ transform: 'scaleY(0.18)' }}
          />
        ))}
      </span>
      <span className="font-mono text-[10px] tracking-[0.2em] text-white/70 uppercase">{on ? 'Sound on' : 'Sound off'}</span>
    </button>
  )
}
