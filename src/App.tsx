import { useEffect, useState } from 'react'
import { Explorer } from './components/Explorer'
import { Intro } from './components/Intro'
import { SiteNav } from './components/SiteNav'

export default function App() {
  const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem('canagi-theme') === 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    window.localStorage.setItem('canagi-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <main>
      <SiteNav darkMode={darkMode} onThemeToggle={() => setDarkMode((value) => !value)} />
      <Intro />
      <Explorer />
    </main>
  )
}
