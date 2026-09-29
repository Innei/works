import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { live } from './store'
import './index.css'

live.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
live.mobile = matchMedia('(pointer: coarse), (max-width: 767px)').matches

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
