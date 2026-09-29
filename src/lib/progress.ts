const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const activeIndex = (progress: number, count: number) =>
  clamp(Math.round(progress), 0, count - 1)

export const sceneWeight = (progress: number, index: number) =>
  clamp(1 - Math.abs(progress - index), 0, 1)

export const isMounted = (progress: number, index: number) => Math.abs(progress - index) < 1.5
