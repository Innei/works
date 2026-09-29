import { motion, type Variants } from 'motion/react'
import { useMemo, type ReactNode } from 'react'

import { audio } from '../audio/engine'
import { useUI } from '../store'

const variants: Variants = {
  out: { opacity: 0, y: 28, filter: 'blur(10px)', transition: { duration: 0.35 } },
  in: ({ i, base }: { i: number; base: number }) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as const, delay: base + i * 0.07 },
  }),
}

interface RevealProps {
  shown: boolean
  i: number
  base?: number
  children: ReactNode
  className?: string
}

export function Reveal({ shown, i, base = 0.15, children, className }: RevealProps) {
  return (
    <motion.div className={className} custom={{ i, base }} variants={variants} initial="out" animate={shown ? 'in' : 'out'}>
      {children}
    </motion.div>
  )
}

export function useBeatDelay(shown: boolean) {
  return useMemo(() => (shown && useUI.getState().audioOn ? Math.min(audio.untilNextBeat(), 0.8) : 0.15), [shown])
}
