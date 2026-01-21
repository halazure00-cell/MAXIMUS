import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { isSupabaseConfigured, supabaseConfigError } from './lib/supabaseClient';
import Auth from './components/Auth';
import BottomNavigation from './components/BottomNavigation';
import PageTransition from './components/PageTransition';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider, useToast } from './context/ToastContext';
import { useSettings } from './context/SettingsContext';
import { SyncProvider } from './context/SyncContext';
import { useTutorial } from './context/TutorialContext';

// Lazy load heavy routes for better code splitting
const ProfitEngine = lazy(() => import('./components/ProfitEngine'));
const Insight = lazy(() => import('./components/Insight'));
const Riwayat = lazy(() => import('./pages/Riwayat'));
const ProfileSettings = lazy(() => import('./components/ProfileSettings'));
const HeatmapDebugView = lazy(() => import('./components/HeatmapDebugView'));
const OnboardingSlides = lazy(() => import('./components/tutorial/OnboardingSlides'));

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
    const [showDebug, setShowDebug] = useState(false);

    // Check for debug mode in URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setShowDebug(params.get('debug') === 'heatmap');
    }, [location.search]);

    // Show debug view if ?debug=heatmap (lazy-loaded to avoid bundling in main chunk)
    if (showDebug) {
        return (
            <div className="min-h-screen bg-ui-background">
                <div className="max-w-4xl mx-auto">
                    <div className="p-4 bg-ui-danger/20 border-b border-ui-danger">
                        <div className="text-sm font-bold text-ui-danger">⚠️ DEBUG MODE ACTIVE</div>
                        <div className="text-xs text-ui-muted">Remove ?debug=heatmap from URL to return to normal view</div>
                    </div>
                    <Suspense fallback={<LazyLoadingFallback />}>
                        <HeatmapDebugView />
                    </Suspense>
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence mode="sync">
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/"
                    element={
                        <PageTransition>
                            <Suspense fallback={<LazyLoadingFallback />}>
                                <ProfitEngine showToast={showToast} />
                            </Suspense>
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
                            <Suspense fallback={<LazyLoadingFallback />}>
                                <Riwayat showToast={showToast} />
                            </Suspense>
                        </PageTransition>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <PageTransition>
                            <Suspense fallback={<LazyLoadingFallback />}>
                                <ProfileSettings showToast={showToast} />
                            </Suspense>
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
    const { tutorialState, completeOnboarding } = useTutorial();
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Show onboarding after successful login if not completed
    useEffect(() => {
        if (session && !tutorialState.onboardingCompleted && !loading) {
            // Small delay to let the app settle
            const timer = setTimeout(() => {
                setShowOnboarding(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [session, tutorialState.onboardingCompleted, loading]);

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        completeOnboarding();
    };

    const handleOnboardingSkip = () => {
        setShowOnboarding(false);
        completeOnboarding();
    };

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
        <>
            <BrowserRouter>
                <AppShell showToast={showToast} />
            </BrowserRouter>

            {/* Onboarding overlay */}
            {showOnboarding && (
                <Suspense fallback={null}>
                    <OnboardingSlides
                        onComplete={handleOnboardingComplete}
                        onSkip={handleOnboardingSkip}
                    />
                </Suspense>
            )}
        </>
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
