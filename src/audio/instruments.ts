export const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12)

let noiseBuffer: AudioBuffer | undefined

function noise(ctx: BaseAudioContext) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = noiseBuffer.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  return src
}

function env(ctx: BaseAudioContext, dest: AudioNode, t: number, peak: number, attack: number, decay: number) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  g.connect(dest)
  return g
}

function tone(ctx: BaseAudioContext, dest: AudioNode, t: number, type: OscillatorType, from: number, to: number, drop: number, peak: number, decay: number) {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(to, t + drop)
  osc.connect(env(ctx, dest, t, peak, 0.003, decay))
  osc.start(t)
  osc.stop(t + decay + 0.05)
}

function burst(ctx: BaseAudioContext, dest: AudioNode, t: number, type: BiquadFilterType, freq: number, peak: number, decay: number) {
  const src = noise(ctx)
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  src.connect(f).connect(env(ctx, dest, t, peak, 0.001, decay))
  src.start(t, Math.random() * 0.5)
  src.stop(t + decay + 0.05)
}

export const drums = {
  kick: (ctx: BaseAudioContext, dest: AudioNode, t: number, v: number) => tone(ctx, dest, t, 'sine', 150, 45, 0.12, 0.9 * v, 0.45),
  snare: (ctx: BaseAudioContext, dest: AudioNode, t: number, v: number) => {
    tone(ctx, dest, t, 'triangle', 220, 160, 0.05, 0.25 * v, 0.12)
    burst(ctx, dest, t, 'highpass', 1800, 0.35 * v, 0.18)
  },
  hat: (ctx: BaseAudioContext, dest: AudioNode, t: number, v: number) => burst(ctx, dest, t, 'highpass', 8000, 0.12 * v, 0.04),
  shaker: (ctx: BaseAudioContext, dest: AudioNode, t: number, v: number) => burst(ctx, dest, t, 'bandpass', 6000, 0.14 * v, 0.07),
  clap: (ctx: BaseAudioContext, dest: AudioNode, t: number, v: number) => {
    for (const d of [0, 0.012, 0.025]) burst(ctx, dest, t + d, 'bandpass', 1400, 0.3 * v, d === 0.025 ? 0.16 : 0.02)
  },
  tom: (ctx: BaseAudioContext, dest: AudioNode, t: number, v: number) => {
    tone(ctx, dest, t, 'sine', 120, 70, 0.25, 0.7 * v, 0.6)
    burst(ctx, dest, t, 'lowpass', 900, 0.12 * v, 0.05)
  },
  ping: (ctx: BaseAudioContext, dest: AudioNode, t: number, v: number) => tone(ctx, dest, t, 'sine', 2637, 2637, 0.01, 0.08 * v, 0.9),
}

export function crackle(ctx: BaseAudioContext, dest: AudioNode, t: number) {
  burst(ctx, dest, t, 'highpass', 3000, 0.05 + Math.random() * 0.08, 0.004)
}

export function pluck(ctx: BaseAudioContext, dest: AudioNode, t: number, note: number, v: number) {
  const osc = ctx.createOscillator()
  const f = ctx.createBiquadFilter()
  osc.type = 'triangle'
  osc.frequency.value = mtof(note)
  f.type = 'lowpass'
  f.frequency.setValueAtTime(4000, t)
  f.frequency.exponentialRampToValueAtTime(500, t + 0.6)
  osc.connect(f).connect(env(ctx, dest, t, 0.12 * v, 0.005, 1.4))
  osc.start(t)
  osc.stop(t + 1.5)
}

export function chime(ctx: BaseAudioContext, dest: AudioNode, t: number, note: number, v: number) {
  const carrier = ctx.createOscillator()
  const mod = ctx.createOscillator()
  const depth = ctx.createGain()
  carrier.frequency.value = mtof(note)
  mod.frequency.value = mtof(note) * 3.5
  depth.gain.setValueAtTime(mtof(note) * 2, t)
  depth.gain.exponentialRampToValueAtTime(1, t + 2)
  mod.connect(depth).connect(carrier.frequency)
  carrier.connect(env(ctx, dest, t, 0.08 * v, 0.002, 3))
  for (const o of [carrier, mod]) {
    o.start(t)
    o.stop(t + 3.1)
  }
}

export function bass(ctx: BaseAudioContext, dest: AudioNode, t: number, note: number, length: number) {
  const osc = ctx.createOscillator()
  const sub = ctx.createOscillator()
  const f = ctx.createBiquadFilter()
  osc.type = 'sawtooth'
  sub.type = 'sine'
  osc.frequency.value = mtof(note)
  sub.frequency.value = mtof(note)
  f.type = 'lowpass'
  f.Q.value = 4
  f.frequency.setValueAtTime(900, t)
  f.frequency.exponentialRampToValueAtTime(180, t + length)
  const out = env(ctx, dest, t, 0.22, 0.008, length)
  osc.connect(f).connect(out)
  sub.connect(out)
  for (const o of [osc, sub]) {
    o.start(t)
    o.stop(t + length + 0.05)
  }
}

export function impulse(ctx: BaseAudioContext, seconds: number) {
  const length = ctx.sampleRate * seconds
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const ch = buffer.getChannelData(c)
    for (let i = 0; i < length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3
  }
  return buffer
}
