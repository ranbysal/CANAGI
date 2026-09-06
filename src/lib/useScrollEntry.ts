import { useEffect } from 'react'
import { createScrollCharge } from './scrollCharge'

/** A scroll is an entry gesture, never a timeline position. */
export function useScrollEntry(enabled: boolean, onEnter: () => void, onProgress: (progress: number) => void) {
  useEffect(() => {
    if (!enabled) return
    const charge = createScrollCharge()
    onProgress(0)
    let readyAt = performance.now() + 300
    let started = false
    let completionTimer: number | undefined
    let touch: { x: number; y: number; units: number } | null = null
    const update = (progress: number) => {
      if (started) return
      onProgress(progress)
      if (progress === 1) {
        started = true
        // Let the final third visibly fill before playing the automatic exit.
        completionTimer = window.setTimeout(onEnter, 260)
      }
    }
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      if (!event.deltaY) return
      event.preventDefault()
      if (started) return
      const now = performance.now()
      // Wait for leftover trackpad momentum to settle after returning home.
      if (now < readyAt) { readyAt = now + 180; return }
      update(charge.wheel(event.deltaY, event.deltaMode, now))
    }
    const onTouchStart = (event: TouchEvent) => {
      const point = event.touches[0]
      touch = event.touches.length === 1 ? { x: point.clientX, y: point.clientY, units: 0 } : null
    }
    const onTouchMove = (event: TouchEvent) => {
      if (!touch || event.touches.length !== 1 || started) return
      const point = event.touches[0]
      const deltaY = touch.y - point.clientY
      if (!deltaY || Math.abs(point.clientX - touch.x) > Math.abs(deltaY)) return
      event.preventDefault()
      const units = Math.max(-1, Math.min(1, deltaY / 100))
      update(charge.add(units - touch.units))
      touch.units = units
    }
    const onTouchEnd = () => { touch = null }
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.repeat) return
      if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, [contenteditable]')) return
      if (['ArrowDown', 'PageDown', ' ', 'ArrowUp', 'PageUp'].includes(event.key)) {
        event.preventDefault()
        if (!started) update(charge.add(event.key === 'ArrowUp' || event.key === 'PageUp' ? -1 : 1))
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(completionTimer)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('keydown', onKey)
    }
  }, [enabled, onEnter, onProgress])
}
