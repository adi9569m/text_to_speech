import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Clear any cached tab icon immediately
const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link')
favicon.rel = 'icon'
favicon.href = 'data:,'
if (!favicon.parentNode) {
  document.head.appendChild(favicon)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
