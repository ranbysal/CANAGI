import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Explorer } from './components/Explorer'
import { Intro } from './components/Intro'
import { SiteNav } from './components/SiteNav'
import { createEntrySequence, type EntryScene } from './lib/entrySequence'
import { useScrollEntry } from './lib/useScrollEntry'

export default function App() {
  const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem('canagi-theme') === 'dark')
  const [scene, setScene] = useState<EntryScene>(() => ['#explore', '#methodology'].includes(window.location.hash) ? 'explorer' : 'intro')
  const appRef = useRef<HTMLElement>(null)
  const initialScene = useRef(scene)
  const previousScene = useRef(scene)
  const sequenceRef = useRef<ReturnType<typeof createEntrySequence> | null>(null)
  const destinationRef = useRef<'explore' | 'methodology'>(window.location.hash === '#methodology' ? 'methodology' : 'explore')
  const running = scene !== 'intro' && scene !== 'explorer'
  const returning = scene === 'returning' || scene === 'arriving'

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light'
    window.localStorage.setItem('canagi-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const sequence = createEntrySequence(setScene, initialScene.current)
    sequenceRef.current = sequence
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionChange = () => {
      if (reducedMotion.matches) sequence.finish()
    }
    reducedMotion.addEventListener('change', onMotionChange)
    return () => {
      sequence.dispose()
      sequenceRef.current = null
      reducedMotion.removeEventListener('change', onMotionChange)
    }
  }, [])

  useLayoutEffect(() => {
    if (!running) return
    const root = document.documentElement
    const body = document.body
    const previousRootOverflow = root.style.overflow
    const previousBodyOverflow = body.style.overflow
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') sequenceRef.current?.finish()
      if ([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      root.style.overflow = previousRootOverflow
      body.style.overflow = previousBodyOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [running])

  useLayoutEffect(() => {
    if (scene === 'entering' || scene === 'arriving') window.scrollTo({ top: 0, behavior: 'instant' })
    if (scene === 'arriving' || scene === 'intro') appRef.current?.style.setProperty('--entry-progress', '0')
    if (scene === 'intro' && previousScene.current !== 'intro') {
      window.scrollTo({ top: 0, behavior: 'instant' })
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
      document.getElementById('intro-title')?.focus({ preventScroll: true })
    }
    if (scene === 'explorer') {
      const target = document.getElementById(destinationRef.current === 'methodology' ? 'methodology' : 'explorer-title')
      window.scrollTo({ top: 0, behavior: 'instant' })
      if (destinationRef.current === 'methodology') target?.scrollIntoView({ behavior: 'instant', block: 'start' })
      target?.focus({ preventScroll: true })
    }
    previousScene.current = scene
  }, [scene])

  const enter = useCallback((destination: 'explore' | 'methodology' = 'explore') => {
    destinationRef.current = destination
    sequenceRef.current?.start(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const home = useCallback(() => {
    sequenceRef.current?.home(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const setEntryProgress = useCallback((progress: number) => {
    appRef.current?.style.setProperty('--entry-progress', String(progress))
  }, [])

  useScrollEntry(scene === 'intro', enter, setEntryProgress)

  return (
    <main className="canagi-app" data-scene={scene} ref={appRef}>
      <SiteNav darkMode={darkMode} onThemeToggle={() => setDarkMode((value) => !value)} onExplore={() => enter()} onMethodology={() => enter('methodology')} disabled={scene !== 'intro'} />
      <div className="launch-scene" inert={scene !== 'intro'} aria-hidden={scene === 'entering' || scene === 'explorer' || scene === 'returning'}>
        <Intro onEnter={() => enter()} busy={running} />
      </div>
      <Explorer interactive={scene === 'explorer'} hidden={scene === 'intro' || scene === 'leaving' || scene === 'arriving'} />
      <button className="enter-button home-button" type="button" onClick={home} disabled={scene !== 'explorer'} aria-busy={scene === 'returning'} aria-label="Home, return to launch screen">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>HOME</span>
      </button>
      <p className="sr-only" role="status">{returning ? 'Returning home.' : running ? 'Opening the job market.' : scene === 'explorer' ? 'Job market ready.' : 'Launch page ready.'}</p>
    </main>
  )
}
