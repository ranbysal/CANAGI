import { useEffect, useRef } from 'react'
import type { EntryScene } from '../lib/entrySequence'
import type { ContentPage } from '../lib/contentPages'
import type { Mosaic } from '../lib/mosaicLayout'
import { motionState, setStageSupported, subscribeMotion } from '../lib/motionStore'
import { StageEngine, type StageMode } from '../lib/stageEngine'

interface Props { scene: EntryScene; page: ContentPage; darkMode: boolean; mosaic: Mosaic }

function modeFor(scene: EntryScene, page: ContentPage): StageMode {
  if (scene === 'entering' || scene === 'explorer') return page === 'overview' ? scene : 'hidden'
  return scene
}

/** The WebGL layer behind the launch page and the visualizer heading. */
export function ParticleStage({ scene, page, darkMode, mosaic }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<StageEngine | null>(null)

  useEffect(() => {
    // A fresh canvas per mount keeps a disposed WebGL context from being reused.
    const canvas = document.createElement('canvas')
    hostRef.current!.appendChild(canvas)
    const count = window.innerWidth < 760 || (navigator.hardwareConcurrency ?? 8) <= 4 ? 8000 : 15000
    const engine = new StageEngine(canvas, {
      intro: () => document.querySelector('.intro-art'),
      explorer: () => document.querySelector('.overview-page .explorer-art'),
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
  useEffect(() => { engineRef.current?.setMode(modeFor(scene, page)) }, [scene, page])

  return <div className="particle-stage" ref={hostRef} aria-hidden="true" />
}
