/**
 * Frame-rate state shared by the launch scene, the WebGL stage and its HUD.
 * Values are read on every animation frame, so they live outside React state.
 */
type Listener = () => void

const listeners = new Set<Listener>()
export type SurfacePhase = 'idle' | 'out' | 'in'
const state = { charge: 0, webgl: true, surface: 'idle' as SurfacePhase }

function notify() { listeners.forEach(listener => listener()) }

export const motionState: Readonly<typeof state> = state

export function setCharge(value: number) {
  const next = Math.max(0, Math.min(1, value))
  if (next === state.charge) return
  state.charge = next
  notify()
}

export function setStageSupported(value: boolean) {
  if (value === state.webgl) return
  state.webgl = value
  notify()
}

/** A page swap inside the explorer: points flood out, then gather into the next page. */
export function setSurface(phase: SurfacePhase) {
  if (phase === state.surface) return
  state.surface = phase
  notify()
}

export function subscribeMotion(listener: Listener) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** Four narrative stages: Canada, Today, Tomorrow, Together. */
export const STAGE_COUNT = 4
export function stageOf(charge: number) {
  return Math.min(STAGE_COUNT - 1, Math.floor(charge * (STAGE_COUNT - 1) + 0.35))
}
