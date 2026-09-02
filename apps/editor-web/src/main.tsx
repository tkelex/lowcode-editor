import ReactDOM from 'react-dom/client'
import App from './app/App.tsx'
import './index.css'
import { AppErrorBoundary } from './app/components/AppErrorBoundary.tsx'
import { AppProviders } from './app/providers/AppProviders.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <AppProviders>
        <App />
    </AppProviders>
  </AppErrorBoundary>
)
