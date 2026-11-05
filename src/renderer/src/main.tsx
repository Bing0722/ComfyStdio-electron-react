import { createRoot } from 'react-dom/client'
import App from './app/App'
import { AppProviders } from './app/AppProviders'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

const root = document.getElementById('root')
if (!root) throw new Error('ComfyStdio root element is missing')
createRoot(root).render(
  <AppProviders>
    <App />
  </AppProviders>,
)
