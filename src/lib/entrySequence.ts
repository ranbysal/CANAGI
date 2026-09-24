export type EntryScene = 'intro' | 'leaving' | 'entering' | 'explorer' | 'returning' | 'arriving'

// The launch copy lifts away while the formation floods the screen with points.
export const EXIT_DURATION_MS = 900
// The next page rises at once while the points gather into its heading.
export const ENTER_DURATION_MS = 1300
// Home gathers the points back into the launch formation.
export const HOME_DURATION_MS = 1300

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

/** Position along one diagonal wave across the map, from 0 (top left) to 1. */
export function tileSweep(x: number, y: number, width: number, height: number) {
  return Math.min(1, (x / Math.max(1, width)) * 0.72 + (y / Math.max(1, height)) * 0.28)
}

/** Tiles unfold in that wave once the map is revealed. */
export function tileEntryDelay(x: number, y: number, width: number, height: number) {
  return Math.round(80 + tileSweep(x, y, width, height) * 950)
}
