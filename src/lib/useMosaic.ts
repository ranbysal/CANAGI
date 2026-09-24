import { useEffect, useMemo, useState } from 'react'
import { layoutMosaic, PLACEHOLDER_MOSAIC, summarizeMosaic, type MosaicSource } from './mosaicLayout'
import { loadOccupations } from './occupationData'

// Fixed layers (the canvas and shutter) exclude a reserved scrollbar gutter.
const viewportAspect = () => document.documentElement.clientWidth / Math.max(1, window.innerHeight)

/** The field mosaic at the current viewport shape, shared by the canvas and the shutter. */
export function useMosaic() {
  const [source, setSource] = useState<MosaicSource>(PLACEHOLDER_MOSAIC)
  const [aspect, setAspect] = useState(viewportAspect)
  useEffect(() => {
    let live = true
    loadOccupations().then(data => { if (live) setSource(summarizeMosaic(data)) }).catch(() => undefined)
    return () => { live = false }
  }, [])
  useEffect(() => {
    let timer = 0
    const onResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setAspect(current => {
        const next = viewportAspect()
        return Math.abs(next - current) < 0.002 ? current : next
      }), 120)
    }
    window.addEventListener('resize', onResize)
    return () => { window.clearTimeout(timer); window.removeEventListener('resize', onResize) }
  }, [])
  return useMemo(() => layoutMosaic(source, aspect), [source, aspect])
}
