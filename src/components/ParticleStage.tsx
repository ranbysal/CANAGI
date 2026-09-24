import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { EntryScene } from '../lib/entrySequence'
import type { Mosaic } from '../lib/mosaicLayout'
import { motionState, setStageSupported, subscribeMotion, type SurfacePhase } from '../lib/motionStore'
import { StageEngine, type StageMode } from '../lib/stageEngine'

interface Props { scene: EntryScene; darkMode: boolean; mosaic: Mosaic }

const readSurface = () => motionState.surface

function modeFor(scene: EntryScene, surface: SurfacePhase): StageMode {
  if (scene !== 'explorer') return scene
  return surface === 'out' ? 'page-out' : surface === 'in' ? 'page-in' : 'page'
}

/** The WebGL layer behind the launch page and every page heading. */
export function ParticleStage({ scene, darkMode, mosaic }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const surface = useSyncExternalStore(subscribeMotion, readSurface, () => 'idle' as SurfacePhase)
  const engineRef = useRef<StageEngine | null>(null)

  useEffect(() => {
    // A fresh canvas per mount keeps a disposed WebGL context from being reused.
    const canvas = document.createElement('canvas')
    hostRef.current!.appendChild(canvas)
    const count = window.innerWidth < 760 || (navigator.hardwareConcurrency ?? 8) <= 4 ? 6000 : 11000
    const engine = new StageEngine(canvas, {
      intro: () => document.querySelector('.intro-art'),
      page: () => document.querySelector('.explorer-section .page-decoration'),
    }, count)
    const supported = engine.start(() => motionState.charge)
    setStageSupported(supported)
    if (!supported) { canvas.remove(); return }
    engineRef.current = engine
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotion = () => engine.setReducedMotion(media.matches)
    onMotion()
    media.addEventListener('change', onMotion)
    const unsubscribe = subscribeMotion(() => engine.wake())
    return () => {
      unsubscribe()
      media.removeEventListener('change', onMotion)
      engine.dispose()
      engineRef.current = null
      canvas.remove()
    }
  }, [])

  useEffect(() => { engineRef.current?.setTheme(darkMode) }, [darkMode])
  useEffect(() => { engineRef.current?.setMosaic(mosaic) }, [mosaic])
  useEffect(() => { engineRef.current?.setMode(modeFor(scene, surface)) }, [scene, surface])

  return <div className="particle-stage" ref={hostRef} aria-hidden="true" />
}
