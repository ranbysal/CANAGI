import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Explorer } from './components/Explorer'
import { Intro } from './components/Intro'
import { SiteNav } from './components/SiteNav'
import { createEntrySequence, type EntryScene } from './lib/entrySequence'
import { useScrollEntry } from './lib/useScrollEntry'
import { pageAddress, pageFromLocation, type ContentPage, type SitePage } from './lib/contentPages'

function writePage(page: SitePage, push = true) {
  const { canagiOverlay: _overlay, ...state } = window.history.state ?? {}
  window.history[push ? 'pushState' : 'replaceState'](state, '', pageAddress(page, window.location.pathname, window.location.search))
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem('canagi-theme') === 'dark')
  const [initialPage] = useState(() => pageFromLocation(window.location.hash, window.location.search))
  const [page, setPage] = useState<ContentPage>(initialPage === 'home' ? 'overview' : initialPage)
  const [scene, setScene] = useState<EntryScene>(initialPage === 'home' ? 'intro' : 'explorer')
  const appRef = useRef<HTMLElement>(null)
  const initialScene = useRef(scene)
  const previousScene = useRef(scene)
  const sequenceRef = useRef<ReturnType<typeof createEntrySequence> | null>(null)
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
    const onNavigation = () => {
      const destination = pageFromLocation(window.location.hash, window.location.search)
      sequence.finish()
      if (destination === 'home') sequence.home(true)
      else { setPage(destination); sequence.start(true) }
    }
    window.addEventListener('popstate', onNavigation)
    window.addEventListener('hashchange', onNavigation)
    return () => {
      sequence.dispose()
      sequenceRef.current = null
      reducedMotion.removeEventListener('change', onMotionChange)
      window.removeEventListener('popstate', onNavigation)
      window.removeEventListener('hashchange', onNavigation)
    }
  }, [])

  useLayoutEffect(() => { writePage(initialPage, false) }, [initialPage])

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
      document.getElementById('intro-title')?.focus({ preventScroll: true })
    }
    if (scene === 'explorer') {
      const target = document.getElementById(page === 'overview' ? 'explorer-title' : page === 'careers' ? 'career-page-title' : 'field-comparison-title')
      window.scrollTo({ top: 0, behavior: 'instant' })
      target?.focus({ preventScroll: true })
    }
    previousScene.current = scene
  }, [scene, page])

  useEffect(() => {
    document.title = scene === 'intro' ? "CANAGI | Canada's AI Job Economy" : `${page === 'overview' ? 'Canadian Job Market Visualizer' : page === 'careers' ? 'The Career Explorer' : 'Compare career fields'} | CANAGI`
  }, [scene, page])

  const enter = useCallback((destination: ContentPage = 'overview') => {
    if (sequenceRef.current?.start(window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      setPage(destination)
      writePage(destination)
    }
  }, [])

  const home = useCallback(() => {
    if (sequenceRef.current?.home(window.matchMedia('(prefers-reduced-motion: reduce)').matches)) writePage('home')
  }, [])

  const navigate = useCallback((destination: ContentPage) => {
    if (destination === page) return
    setPage(destination)
    writePage(destination)
  }, [page])

  const setEntryProgress = useCallback((progress: number) => {
    appRef.current?.style.setProperty('--entry-progress', String(progress))
  }, [])

  useScrollEntry(scene === 'intro', enter, setEntryProgress)

  return (
    <main className="canagi-app" data-scene={scene} ref={appRef}>
      <SiteNav darkMode={darkMode} onThemeToggle={() => setDarkMode((value) => !value)} onNavigate={enter} disabled={scene !== 'intro'} />
      <div className="launch-scene" inert={scene !== 'intro'} aria-hidden={scene === 'entering' || scene === 'explorer' || scene === 'returning'}>
        <Intro onEnter={() => enter()} busy={running} />
      </div>
      <Explorer interactive={scene === 'explorer'} hidden={scene === 'intro' || scene === 'leaving' || scene === 'arriving'} page={page} onNavigate={navigate} onHome={home} darkMode={darkMode} onThemeToggle={() => setDarkMode(value => !value)} />
      <p className="sr-only" role="status">{returning ? 'Returning home.' : running ? 'Opening the job market.' : scene === 'explorer' ? 'Job market ready.' : 'Launch page ready.'}</p>
    </main>
  )
}
