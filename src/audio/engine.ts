import { bass, chime, crackle, drums, impulse, mtof, pluck } from './instruments'
import { hit, schedule, stepSeconds, type Clock, type Groove, type StepEvent, type Voice } from './sequencer'

export type BeatKind = 'kick' | 'hat' | 'accent'

interface Graph {
  ctx: AudioContext
  master: GainNode
  drums: GainNode
  synth: GainNode
  padFilter: BiquadFilterNode
  duck: GainNode
  analyser: AnalyserNode
  data: Uint8Array<ArrayBuffer>
}

interface Pad {
  gain: GainNode
  oscs: OscillatorNode[]
}

const LOOKAHEAD = 0.12
const TICK_MS = 25

function build(): Graph {
  const ctx = new AudioContext()
  const master = ctx.createGain()
  master.gain.value = 0
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -14
  compressor.ratio.value = 4
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.8
  master.connect(compressor).connect(analyser).connect(ctx.destination)

  const reverb = ctx.createConvolver()
  reverb.buffer = impulse(ctx, 4)
  const wet = ctx.createGain()
  wet.gain.value = 0.5
  wet.connect(reverb).connect(master)

  const delay = ctx.createDelay(2)
  delay.delayTime.value = 0.375
  const feedback = ctx.createGain()
  feedback.gain.value = 0.3
  delay.connect(feedback).connect(delay)
  delay.connect(wet)

  const drumBus = ctx.createGain()
  drumBus.gain.value = 0.8
  drumBus.connect(master)
  const drumSend = ctx.createGain()
  drumSend.gain.value = 0.12
  drumBus.connect(drumSend).connect(wet)

  const synth = ctx.createGain()
  synth.gain.value = 0.8
  synth.connect(master)
  synth.connect(wet)
  synth.connect(delay)

  const padFilter = ctx.createBiquadFilter()
  padFilter.type = 'lowpass'
  padFilter.frequency.value = 1400
  padFilter.Q.value = 0.5
  const lfo = ctx.createOscillator()
  const lfoDepth = ctx.createGain()
  lfo.frequency.value = 0.07
  lfoDepth.gain.value = 350
  lfo.connect(lfoDepth).connect(padFilter.frequency)
  lfo.start()
  const duck = ctx.createGain()
  padFilter.connect(duck)
  duck.connect(master)
  duck.connect(wet)

  return { ctx, master, drums: drumBus, synth, padFilter, duck, analyser, data: new Uint8Array(analyser.frequencyBinCount) }
}

class AudioEngine {
  private graph?: Graph
  private pad?: Pad
  private groove?: Groove
  private pending: Groove | null = null
  private padGroove?: Groove
  private clock: Clock = { step: 0, time: 0 }
  private barsInGroove = 0
  private timer = 0
  private suspendTimer = 0
  private generation = 0
  private beats: { time: number; kind: BeatKind }[] = []
  private quarters: number[] = []
  on = false

  setGroove(groove: Groove) {
    if (!this.on) {
      this.groove = groove
      this.pending = null
      return
    }
    this.pending = groove === this.groove ? null : groove
  }

  async start() {
    const gen = ++this.generation
    window.clearTimeout(this.suspendTimer)
    if (!this.graph) {
      this.graph = build()
      const { ctx } = this.graph
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
      if (session) session.type = 'playback'
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.on && ctx.state !== 'running') void ctx.resume()
      })
    }
    const { ctx, master } = this.graph
    await ctx.resume()
    if (gen !== this.generation || !this.groove) return
    this.on = true
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(0.7, ctx.currentTime, 0.4)
    this.pending = null
    this.padGroove = undefined
    this.barsInGroove = 0
    this.clock = { step: 0, time: ctx.currentTime + 0.05 }
    this.tick()
  }

  stop() {
    this.generation++
    this.groove = this.pending ?? this.groove
    this.pending = null
    this.on = false
    window.clearTimeout(this.timer)
    this.beats = []
    this.quarters = []
    const g = this.graph
    if (!g) return
    g.master.gain.cancelScheduledValues(g.ctx.currentTime)
    g.master.gain.setTargetAtTime(0, g.ctx.currentTime, 0.2)
    this.releasePad(g.ctx.currentTime, 0.5)
    const gen = this.generation
    this.suspendTimer = window.setTimeout(() => gen === this.generation && g.ctx.suspend(), 1500)
  }

  drainBeats() {
    if (!this.on || !this.graph) return []
    const now = this.graph.ctx.currentTime
    const due = this.beats.filter((b) => b.time <= now && b.time > now - 0.1)
    this.beats = this.beats.filter((b) => b.time > now)
    return due
  }

  untilNextBeat() {
    if (!this.on || !this.graph || !this.groove) return 0
    const now = this.graph.ctx.currentTime
    const next = this.quarters.find((t) => t > now)
    if (next !== undefined) return next - now
    const beat = stepSeconds(this.groove.bpm) * 4
    const last = this.quarters.at(-1) ?? now
    return beat - ((now - last) % beat)
  }

  level() {
    if (!this.on || !this.graph) return 0
    const { analyser, data } = this.graph
    analyser.getByteFrequencyData(data)
    let sum = 0
    for (let i = 1; i < 24; i++) sum += data[i]
    return sum / (23 * 255)
  }

  bands(count: number) {
    if (!this.on || !this.graph) return new Array<number>(count).fill(0)
    const { analyser, data } = this.graph
    analyser.getByteFrequencyData(data)
    const size = Math.floor(48 / count)
    return Array.from({ length: count }, (_, b) => {
      let sum = 0
      for (let i = 0; i < size; i++) sum += data[2 + b * size + i]
      return sum / (size * 255)
    })
  }

  private tick() {
    if (!this.on || !this.graph || !this.groove) return
    if (this.clock.time < this.graph.ctx.currentTime) this.clock.time = this.graph.ctx.currentTime + 0.01
    const r = schedule(this.clock, this.graph.ctx.currentTime + LOOKAHEAD, this.groove, this.pending)
    this.clock = r.clock
    this.pending = r.pending
    for (const e of r.events) this.play(e)
    this.groove = r.groove
    const now = this.graph.ctx.currentTime
    this.quarters = this.quarters.filter((t) => t > now - 2)
    this.beats = this.beats.filter((b) => b.time > now - 0.25)
    this.timer = window.setTimeout(() => this.tick(), TICK_MS)
  }

  private play({ step, time, groove }: StepEvent) {
    const g = this.graph!
    if (step === 0) {
      if (groove !== this.padGroove) this.enterGroove(groove, time)
      else this.barsInGroove++
    }
    if (step % 4 === 0) this.quarters.push(time)

    const kickScale = groove.filterRise ? Math.min(1, this.barsInGroove / 4) : 1
    for (const voice of Object.keys(groove.voices) as Voice[]) {
      let v = hit(groove.voices[voice], step)
      if (!v) continue
      if (voice === 'kick') v *= kickScale
      if (v < 0.05) continue
      drums[voice](g.ctx, g.drums, time, v)
      const kind: BeatKind = voice === 'kick' ? 'kick' : voice === 'hat' || voice === 'shaker' ? 'hat' : 'accent'
      this.beats.push({ time, kind })
      if (voice === 'kick' && groove.sidechain) {
        g.duck.gain.setValueAtTime(0.3, time)
        g.duck.gain.setTargetAtTime(1, time + 0.02, 0.12)
      }
    }

    const b = groove.bass?.[step]
    if (b != null) bass(g.ctx, g.synth, time, b, stepSeconds(groove.bpm) * 1.8)
    const a = groove.arp?.[step]
    if (a != null) (groove.arpVoice === 'chime' ? chime : pluck)(g.ctx, g.synth, time, a, 1)
    if (groove.crackle && Math.random() < 0.35) crackle(g.ctx, g.drums, time + Math.random() * stepSeconds(groove.bpm))
  }

  private enterGroove(groove: Groove, time: number) {
    const g = this.graph!
    this.padGroove = groove
    this.barsInGroove = 0
    this.releasePad(time, 0.6)
    const f = g.padFilter.frequency
    f.cancelScheduledValues(time)
    if (groove.filterRise) {
      f.setValueAtTime(350, time)
      f.exponentialRampToValueAtTime(2600, time + stepSeconds(groove.bpm) * 16 * 8)
    } else {
      f.setTargetAtTime(1400, time, 0.5)
    }

    const gain = g.ctx.createGain()
    gain.gain.setValueAtTime(0, time)
    gain.gain.setTargetAtTime(1, time, 0.6)
    gain.connect(g.padFilter)
    const oscs = groove.pad.flatMap((note) =>
      [-6, 6].map((detune) => {
        const osc = g.ctx.createOscillator()
        const level = g.ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.value = mtof(note)
        osc.detune.value = detune
        level.gain.value = 0.03
        osc.connect(level).connect(gain)
        osc.start(time)
        return osc
      }),
    )
    this.pad = { gain, oscs }
  }

  private releasePad(time: number, tau: number) {
    const pad = this.pad
    if (!pad) return
    pad.gain.gain.cancelScheduledValues(time)
    pad.gain.gain.setTargetAtTime(0, time, tau)
    pad.oscs.forEach((o) => o.stop(time + tau * 6))
    this.pad = undefined
  }
}

export const audio = new AudioEngine()
