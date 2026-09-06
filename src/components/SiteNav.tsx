import { Moon, Sun } from 'lucide-react'

interface SiteNavProps {
  darkMode: boolean
  onThemeToggle: () => void
  onExplore: () => void
  onMethodology: () => void
  disabled: boolean
}

export function SiteNav({ darkMode, onThemeToggle, onExplore, onMethodology, disabled }: SiteNavProps) {
  return (
    <nav className="site-nav" aria-label="Primary navigation" inert={disabled}>
      <a className="nav-wordmark" href="#top" aria-label="CANAGI home">
        CANAGI
      </a>
      <div className="nav-links">
        <a href="#explore" onClick={(event) => { event.preventDefault(); onExplore() }}>Explore</a>
        <a href="#methodology" onClick={(event) => { event.preventDefault(); onMethodology() }}>Methodology</a>
        <a href="https://github.com/ranbysal/CANAGI" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <span className="nav-language" aria-label="Language: English">EN</span>
        <button className="icon-button" type="button" onClick={onThemeToggle} aria-label={darkMode ? 'Use light theme' : 'Use dark theme'}>
          {darkMode ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
        </button>
      </div>
    </nav>
  )
}
