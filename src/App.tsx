import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Explorer } from './components/Explorer'
import { Intro } from './components/Intro'
import { ParticleStage } from './components/ParticleStage'
import { SiteNav } from './components/SiteNav'
import { StageShutter } from './components/StageShutter'
import { createEntrySequence, type EntryScene } from './lib/entrySequence'
import { setCharge } from './lib/motionStore'
import { useMosaic } from './lib/useMosaic'
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
  const [booting, setBooting] = useState(initialPage === 'home')
  const mosaic = useMosaic()
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

  // The first-load entrance plays once; later arrivals use their own choreography.
  useEffect(() => {
    if (!booting) return
    if (scene !== 'intro') { setBooting(false); return }
    const timer = window.setTimeout(() => setBooting(false), 2600)
    return () => window.clearTimeout(timer)
  }, [booting, scene])

  useLayoutEffect(() => {
    if (scene === 'entering' || scene === 'arriving') window.scrollTo({ top: 0, behavior: 'instant' })
    if (scene === 'arriving' || scene === 'intro') { appRef.current?.style.setProperty('--entry-progress', '0'); setCharge(0) }
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
    setCharge(progress)
  }, [])

  // The new theme spreads from the toggle as a circle where view transitions exist.
  const toggleTheme = useCallback(() => {
    const apply = () => flushSync(() => setDarkMode(value => !value))
    if (typeof document.startViewTransition !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return }
    const box = document.activeElement?.closest('.page-theme')?.getBoundingClientRect()
    const x = box ? box.left + box.width / 2 : window.innerWidth - 48, y = box ? box.top + box.height / 2 : 36
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const transition = document.startViewTransition(apply)
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 720, easing: 'cubic-bezier(.7, 0, .25, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    }).catch(() => undefined)
  }, [])

  useScrollEntry(scene === 'intro', enter, setEntryProgress)

  return (
    <main className="canagi-app" data-scene={scene} data-boot={booting ? 'true' : undefined} data-page={page} ref={appRef}>
      <ParticleStage scene={scene} page={page} darkMode={darkMode} mosaic={mosaic} />
      <SiteNav darkMode={darkMode} onThemeToggle={toggleTheme} onNavigate={enter} disabled={scene !== 'intro'} />
      <div className="launch-scene" inert={scene !== 'intro'} aria-hidden={scene === 'entering' || scene === 'explorer' || scene === 'returning'}>
        <Intro onEnter={() => enter()} busy={running} jobs={mosaic.jobs > 1000 ? mosaic.jobs : null} />
      </div>
      <Explorer interactive={scene === 'explorer'} hidden={scene === 'intro' || scene === 'leaving' || scene === 'arriving'} page={page} onNavigate={navigate} onHome={home} darkMode={darkMode} onThemeToggle={toggleTheme} />
      <StageShutter scene={scene} mosaic={mosaic} />
      <div className="scroll-progress" aria-hidden="true" />
      <p className="sr-only" role="status">{returning ? 'Returning home.' : running ? 'Opening the job market.' : scene === 'explorer' ? 'Job market ready.' : 'Launch page ready.'}</p>
    </main>
  )
}
