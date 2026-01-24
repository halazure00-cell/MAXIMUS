import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import { SettingsProvider } from './context/SettingsContext'
import { TutorialProvider } from './context/TutorialContext'

// Load sync debug utilities in development
if (import.meta.env.DEV) {
    import('./lib/syncDebug').then(() => {
        console.log('🔧 Development mode: Sync debug utils loaded');
        console.log('💡 Use syncDebug.checkHealth() in console to check sync status');
    });
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <SettingsProvider>
            <TutorialProvider>
                <App />
            </TutorialProvider>
        </SettingsProvider>
    </StrictMode>,
)
