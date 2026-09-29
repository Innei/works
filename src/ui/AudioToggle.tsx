import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { audio } from '../audio/engine'
import { useUI } from '../store'

const BARS = 5
const KEY = 'portfolio:sound'
const HINT_KEY = 'portfolio:sound-hint'

const readPref = () => {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch {
    return false
  }
}

const hintSeen = () => {
  try {
    return localStorage.getItem(HINT_KEY) === '1' || localStorage.getItem(KEY) !== null
  } catch {
    return false
  }
}

const markHintSeen = () => {
  try {
    localStorage.setItem(HINT_KEY, '1')
  } catch {
    /* storage blocked */
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
  if (on) {
    markHintSeen()
    void audio.start()
  } else audio.stop()
}

export function AudioToggle() {
  const on = useUI((s) => s.audioOn)
  const button = useRef<HTMLButtonElement>(null)
  const bars = useRef<(HTMLSpanElement | null)[]>([])
  const [hint, setHint] = useState(false)

  useEffect(() => {
    if (hintSeen()) return
    const timer = window.setTimeout(() => setHint(true), 2200)
    return () => window.clearTimeout(timer)
  }, [])

  const showHint = hint && !on

  const dismissHint = () => {
    setHint(false)
    markHintSeen()
  }

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
    <div className="fixed right-4 bottom-4 z-20 flex flex-col items-end gap-2.5 md:right-6 md:bottom-6">
      <AnimatePresence>
        {showHint && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex max-w-[16rem] items-start gap-3 rounded-2xl border border-white/10 bg-black/60 py-3 pr-2 pl-4 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.8)] backdrop-blur-xl"
          >
            <button type="button" onClick={() => setSound(true)} className="text-left">
              <span className="block text-[13px] leading-snug text-white/90">Turn on sound</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-white/50">Each project has its own beat. The fluid moves with it.</span>
            </button>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismissHint}
              className="-mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              <span aria-hidden className="text-sm leading-none">×</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    <button
      ref={button}
      type="button"
      aria-pressed={on}
      onClick={() => setSound(!on)}
      className={`relative flex items-center gap-3 rounded-full border bg-white/[0.04] py-2 pr-4 pl-3.5 backdrop-blur-md transition-colors hover:border-white/25 ${showHint ? 'border-white/30' : 'border-white/10'}`}
    >
      {showHint && <span aria-hidden className="absolute inset-0 animate-ping rounded-full border border-white/25 [animation-duration:2.2s]" />}
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
    </div>
  )
}
