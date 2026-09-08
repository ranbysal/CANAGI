import { useEffect, useRef, useState } from 'react'
import { ENTER_DURATION_MS, EXIT_DURATION_MS } from './entrySequence'

export type SurfacePhase = 'idle' | 'out' | 'in'
/** A completed exit always precedes the content swap and the existing entry wave. */
export function createSurfaceTransition(onPhase: (phase: SurfacePhase) => void, clock = { set: (fn: () => void, delay: number) => window.setTimeout(fn, delay), clear: (id: number) => window.clearTimeout(id) }) {
  let timer: number | undefined, phase: SurfacePhase = 'idle', commit: (() => void) | undefined
  const set = (next: SurfacePhase) => { phase = next; onPhase(next) }
  const finish = () => { if (timer !== undefined) clock.clear(timer); timer = undefined; const pending = commit; commit = undefined; pending?.(); set('idle') }
  const cancel = () => { if (timer !== undefined) clock.clear(timer); timer = undefined; commit = undefined; set('idle') }
  return {
    run(action: () => void, instant = false) {
      if (phase !== 'idle') return false
      if (instant) { action(); return true }
      commit = action; set('out')
      timer = clock.set(() => { const pending = commit; commit = undefined; pending?.(); set('in'); timer = clock.set(() => { timer = undefined; set('idle') }, ENTER_DURATION_MS) }, EXIT_DURATION_MS)
      return true
    },
    finish,
    cancel,
    dispose() { if (timer !== undefined) clock.clear(timer); timer = undefined; commit = undefined },
  }
}
export function useSurfaceTransition() {
  const [phase, setPhase] = useState<SurfacePhase>('idle')
  const sequence = useRef<ReturnType<typeof createSurfaceTransition> | null>(null)
  useEffect(() => {
    const current = createSurfaceTransition(setPhase)
    sequence.current = current
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finish = (event: KeyboardEvent) => { if (event.key === 'Escape') current.finish() }
    const changed = () => { if (media.matches) current.finish() }
    const cancel = () => current.cancel()
    window.addEventListener('keydown', finish); media.addEventListener('change', changed)
    window.addEventListener('popstate', cancel); window.addEventListener('hashchange', cancel)
    return () => { current.dispose(); sequence.current = null; window.removeEventListener('keydown', finish); media.removeEventListener('change', changed); window.removeEventListener('popstate', cancel); window.removeEventListener('hashchange', cancel) }
  }, [])
  return { phase, run: (action: () => void) => sequence.current?.run(action, window.matchMedia('(prefers-reduced-motion: reduce)').matches) }
}
