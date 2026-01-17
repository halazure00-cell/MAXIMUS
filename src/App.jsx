import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { isSupabaseConfigured, supabaseConfigError } from './lib/supabaseClient';
import Auth from './components/Auth';
import ProfitEngine from './components/ProfitEngine';
import Riwayat from './pages/Riwayat';
import ProfileSettings from './components/ProfileSettings';
import BottomNavigation from './components/BottomNavigation';
import PageTransition from './components/PageTransition';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider, useToast } from './context/ToastContext';
import { useSettings } from './context/SettingsContext';
import { SyncProvider } from './context/SyncContext';

// Lazy load heavy component with Leaflet
const Insight = lazy(() => import('./components/Insight'));

// Loading fallback for lazy components
function LazyLoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-ui-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-sm text-ui-muted">Loading...</p>
            </div>
        </div>
    );
}

function AnimatedRoutes({ showToast }) {
    const location = useLocation();

    return (
        <AnimatePresence mode="sync">
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/"
                    element={
                        <PageTransition>
                            <ProfitEngine showToast={showToast} />
                        </PageTransition>
                    }
                />
                <Route
                    path="/insight"
                    element={
                        <PageTransition>
                            <Suspense fallback={<LazyLoadingFallback />}>
                                <Insight showToast={showToast} />
                            </Suspense>
                        </PageTransition>
                    }
                />
                <Route
                    path="/history"
                    element={
                        <PageTransition>
                            <Riwayat showToast={showToast} />
                        </PageTransition>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <PageTransition>
                            <ProfileSettings showToast={showToast} />
                        </PageTransition>
                    }
                />
            </Routes>
        </AnimatePresence>
    );
}

function AppShell({ showToast }) {
    return (
        <div
            className="bg-ui-background text-ui-text font-sans flex flex-col w-full"
            style={{
                minHeight: '100vh',
                width: '100%',
                maxWidth: '100%',
                margin: 0,
                padding: 0,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                zIndex: 0,
                isolation: 'isolate'
            }}
        >
            {/* Main content with safe padding for navigation */}
            <main 
                className="flex-1 overflow-y-auto w-full"
                style={{
                    paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    width: '100%',
                    maxWidth: '100%',
                    overflowX: 'hidden',
                    boxSizing: 'border-box'
                }}
            >
                <AnimatedRoutes showToast={showToast} />
            </main>

            {/* Bottom navigation - fixed positioning on top layer */}
            <BottomNavigation />
        </div>
    );
}

function AppContent({ session, loading }) {
    const { showToast } = useToast();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-ui-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-text"></div>
            </div>
        );
    }

    if (!isSupabaseConfigured) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-ui-background p-6">
                <div className="w-full max-w-lg rounded-ui-xl border border-ui-warning/40 bg-ui-warning/10 p-6 text-center text-ui-warning shadow-ui-sm">
                    <h1 className="text-xl font-semibold mb-2 text-ui-text">Konfigurasi Supabase belum lengkap</h1>
                    <p className="text-sm text-ui-warning">
                        {supabaseConfigError ||
                            'Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env agar autentikasi aktif.'}
                    </p>
                </div>
            </div>
        );
    }

    if (!session) {
        return <Auth />;
    }

    return (
        <BrowserRouter>
            <AppShell showToast={showToast} />
        </BrowserRouter>
    );
}

function App() {
    const { session, loading } = useSettings();

    return (
        <ErrorBoundary>
            <ToastProvider>
                <SyncProvider>
                    <ToastContainer />
                    <AppContent session={session} loading={loading} />
                </SyncProvider>
            </ToastProvider>
        </ErrorBoundary>
    );
}

export default App;
