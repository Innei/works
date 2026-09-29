export interface FluidParams {
  palette: [string, string, string]
  modes: [ink: number, gloss: number, silk: number, contour: number]
  warp: number
  speed: number
  scale: number
  density: number
  dissipation: number
  grain: number
  saturation: number
  stretch: number
}

export interface Resolved extends Omit<FluidParams, 'palette' | 'modes'> {
  palette: number[]
  modes: number[]
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

export const hexToLinear = (hex: string) =>
  [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255))

export const resolve = (p: FluidParams): Resolved => ({ ...p, palette: p.palette.flatMap(hexToLinear), modes: [...p.modes] })

const smooth = (t: number) => t * t * (3 - 2 * t)

export function blendAt(progress: number, count: number) {
  const p = Math.min(Math.max(progress, 0), count - 1)
  const from = Math.floor(p)
  return { from, to: Math.min(from + 1, count - 1), t: smooth(p - from) }
}

const lerp = (x: number, y: number, t: number) => x + (y - x) * t

export function mixResolved(a: Resolved, b: Resolved, t: number): Resolved {
  const out = { ...a, palette: [...a.palette], modes: [...a.modes] }
  for (const key of Object.keys(a) as (keyof Resolved)[]) {
    const x = a[key]
    const y = b[key]
    if (Array.isArray(x) && Array.isArray(y)) (out[key] as number[]) = x.map((v, i) => lerp(v, y[i], t))
    else (out[key] as number) = lerp(x as number, y as number, t)
  }
  return out
}
