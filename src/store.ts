import { create } from 'zustand'

interface UIState {
  active: number
  audioOn: boolean
}

export const useUI = create<UIState>(() => ({ active: 0, audioOn: false }))

export const live = {
  progress: 0,
  time: 0,
  audio: 0,
  pointerX: 0,
  pointerY: 0,
  hover: -1,
  reduced: false,
  mobile: false,
}

export const scrollToSection = (index: number) => {
  const el = document.getElementById('scroller')
  if (!el) return
  el.scrollTo({ top: index * el.clientHeight, behavior: live.reduced ? 'auto' : 'smooth' })
  ;(el.children[index] as HTMLElement | undefined)?.focus({ preventScroll: true })
}
