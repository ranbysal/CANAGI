import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/pt-serif/400.css'
import '@fontsource/pt-serif/400-italic.css'
import '@fontsource/pt-serif/700.css'
import '@fontsource-variable/fraunces/opsz.css'
import './styles.css'
import './explorer.css'
import './research.css'
import './refinements.css'
import './motion.css'
import './workspace.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
