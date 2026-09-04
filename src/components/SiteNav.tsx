import { Moon, Sun } from 'lucide-react'

interface SiteNavProps {
  darkMode: boolean
  onThemeToggle: () => void
}

export function SiteNav({ darkMode, onThemeToggle }: SiteNavProps) {
  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <a className="nav-wordmark" href="#top" aria-label="CANAGI home">
        CANAGI
      </a>
      <div className="nav-links">
        <a href="#explore">Explore</a>
        <a href="#methodology">Methodology</a>
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
