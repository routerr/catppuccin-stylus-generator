import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'

declare const __APP_VERSION__: string

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App appVersion={__APP_VERSION__} />
  </StrictMode>
)
