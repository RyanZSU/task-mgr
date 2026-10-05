import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { maybeSeed } from './lib/seed'
import './index.css'

// Seed example data on the very first run (no-op once any data exists).
maybeSeed()

// Register the service worker so the app works offline after first load.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)