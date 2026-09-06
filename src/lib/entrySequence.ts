export type EntryScene = 'intro' | 'leaving' | 'entering' | 'explorer' | 'returning' | 'arriving'

export const EXIT_DURATION_MS = 1250
export const ENTER_DURATION_MS = 2600
export const HOME_DURATION_MS = 1400

interface SequenceClock {
  set: (callback: () => void, delay: number) => number
  clear: (id: number) => void
}

/** Driven by elapsed time, never by scroll position. */
export function createEntrySequence(
  onScene: (scene: EntryScene) => void,
  initialScene: EntryScene = 'intro',
  clock: SequenceClock = { set: (callback, delay) => window.setTimeout(callback, delay), clear: (id) => window.clearTimeout(id) },
) {
  let scene = initialScene
  let timer: number | undefined
  let disposed = false
  const update = (next: EntryScene) => { scene = next; onScene(next) }
  const clear = () => {
    if (timer !== undefined) clock.clear(timer)
    timer = undefined
  }
  const transition = (destination: 'intro' | 'explorer', instant: boolean) => {
    if (instant) {
      update(destination)
      return
    }
    update(destination === 'explorer' ? 'leaving' : 'returning')
    timer = clock.set(() => {
      update(destination === 'explorer' ? 'entering' : 'arriving')
      timer = clock.set(() => {
        timer = undefined
        update(destination)
      }, destination === 'explorer' ? ENTER_DURATION_MS : HOME_DURATION_MS)
    }, EXIT_DURATION_MS)
  }
  return {
    start(instant = false) {
      if (disposed || scene !== 'intro') return false
      transition('explorer', instant)
      return true
    },
    home(instant = false) {
      if (disposed || scene !== 'explorer') return false
      transition('intro', instant)
      return true
    },
    finish() {
      if (disposed || scene === 'intro' || scene === 'explorer') return
      const destination = scene === 'returning' || scene === 'arriving' ? 'intro' : 'explorer'
      clear()
      update(destination)
    },
    dispose() { disposed = true; clear() },
  }
}

/** Leading edges define one left-to-right wave across the whole map. */
export function tileEntryDelay(x: number, y: number, width: number, height: number) {
  return Math.round(680 + (x / Math.max(1, width)) * 950 + (y / Math.max(1, height)) * 85)
}
