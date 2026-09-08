import { NavigationLinks } from './NavigationLinks'
import type { ContentPage } from '../lib/contentPages'

interface SiteNavProps {
  darkMode: boolean
  onThemeToggle: () => void
  onNavigate: (page: ContentPage) => void
  disabled: boolean
}

export function SiteNav({ darkMode, onThemeToggle, onNavigate, disabled }: SiteNavProps) {
  return (
    <nav className="site-nav" aria-label="Primary navigation" inert={disabled}>
      <a className="nav-wordmark" href="#top" aria-label="CANAGI home">
        CANAGI
      </a>
      <NavigationLinks onNavigate={onNavigate} darkMode={darkMode} onThemeToggle={onThemeToggle} />
    </nav>
  )
}
