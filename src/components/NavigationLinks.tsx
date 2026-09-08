import { Moon, Sun } from 'lucide-react'
import { PAGE_HASH, type ContentPage } from '../lib/contentPages'

interface Props {
  page?: ContentPage
  onNavigate: (page: ContentPage) => void
  darkMode: boolean
  onThemeToggle: () => void
}

/** One navigation order across the launch and all working pages. */
export function NavigationLinks({ page, onNavigate, darkMode, onThemeToggle }: Props) {
  return <div className="nav-links unified-links">
    {([['overview', 'Visualizer'], ['careers', 'Career Explorer'], ['fields', 'Compare']] as const).map(([destination, label]) =>
      <a key={destination} className="page-link" aria-current={page === destination ? 'page' : undefined} href={`${window.location.search}${PAGE_HASH[destination]}`} onClick={event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        onNavigate(destination)
      }}>{label}</a>)}
    <span className="nav-divider" aria-hidden="true" />
    <a className="page-link" href="https://github.com/ranbysal/CANAGI" target="_blank" rel="noreferrer">GitHub</a>
    <span className="nav-language" aria-label="Language: English">EN</span>
    <button className="page-theme icon-button" type="button" onClick={onThemeToggle} aria-label={darkMode ? 'Use light theme' : 'Use dark theme'}>
      {darkMode ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
    </button>
  </div>
}
