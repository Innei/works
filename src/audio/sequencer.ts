export type Voice = 'kick' | 'snare' | 'hat' | 'clap' | 'tom' | 'shaker' | 'ping'

export interface Groove {
  bpm: number
  swing: number
  pad: number[]
  voices: Partial<Record<Voice, string>>
  bass?: (number | null)[]
  arp?: (number | null)[]
  arpVoice?: 'pluck' | 'chime'
  crackle?: boolean
  sidechain?: boolean
  filterRise?: boolean
}

export interface Clock {
  step: number
  time: number
}

export interface StepEvent {
  step: number
  time: number
  groove: Groove
}

export const stepSeconds = (bpm: number) => 60 / bpm / 4

export function hit(pattern: string | undefined, step: number) {
  if (!pattern) return 0
  const c = pattern[step % pattern.length]
  return c === 'X' ? 1 : c === 'x' ? 0.7 : 0
}

export function schedule(clock: Clock, until: number, groove: Groove, pending: Groove | null) {
  const events: StepEvent[] = []
  let { step, time } = clock
  while (time < until) {
    if (step % 16 === 0 && pending) {
      groove = pending
      pending = null
    }
    const swing = step % 2 === 1 ? groove.swing * stepSeconds(groove.bpm) : 0
    events.push({ step: step % 16, time: time + swing, groove })
    time += stepSeconds(groove.bpm)
    step++
  }
  return { events, clock: { step, time }, groove, pending }
}
