import ReactDOM from 'react-dom/client'
import App from './app/App.tsx'
import './index.css'
import { AppProviders } from './app/providers/AppProviders.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <AppProviders>
        <App />
    </AppProviders>
)
