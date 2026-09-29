export type Side = 'left' | 'right'

export function focusFor(side: Side | undefined, wide: boolean): [number, number] {
  if (!side) return [0.6, 0.45]
  if (!wide) return [0.5, 0.7]
  return side === 'left' ? [0.68, 0.5] : [0.32, 0.5]
}

export function cardRect(imageAspect: number, screenAspect: number, center: [number, number], wide: boolean) {
  const maxW = wide ? 0.21 : 0.44
  const maxH = wide ? 0.34 : 0.2
  let hh = maxH
  let hw = (hh * imageAspect) / screenAspect
  if (hw > maxW) {
    hw = maxW
    hh = (hw * screenAspect) / imageAspect
  }
  return [center[0], center[1], hw, hh] as const
}
