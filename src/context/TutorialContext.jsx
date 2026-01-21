import { createContext, useState, useEffect, useContext, useCallback } from 'react';

const TutorialContext = createContext();

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};

const TUTORIAL_VERSION = '1.0.0';
const STORAGE_KEY = 'maximus_tutorial_state';

export const TutorialProvider = ({ children }) => {
    // Initialize tutorial state from localStorage
    const [tutorialState, setTutorialState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse tutorial state', e);
            }
        }
        return {
            version: TUTORIAL_VERSION,
            onboardingCompleted: false,
            completedPageTours: {},
            dismissedTips: {}
        };
    });

    // Persist to localStorage whenever tutorial state changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tutorialState));
    }, [tutorialState]);

    // Mark onboarding as completed
    const completeOnboarding = useCallback(() => {
        setTutorialState(prev => ({
            ...prev,
            onboardingCompleted: true
        }));
    }, []);

    // Mark a page tour as completed
    const completePageTour = useCallback((pageId) => {
        setTutorialState(prev => ({
            ...prev,
            completedPageTours: {
                ...prev.completedPageTours,
                [pageId]: true
            }
        }));
    }, []);

    // Dismiss a microtip
    const dismissTip = useCallback((tipId) => {
        setTutorialState(prev => ({
            ...prev,
            dismissedTips: {
                ...prev.dismissedTips,
                [tipId]: true
            }
        }));
    }, []);

    // Reset all tutorials (for settings)
    const resetTutorials = useCallback(() => {
        setTutorialState({
            version: TUTORIAL_VERSION,
            onboardingCompleted: false,
            completedPageTours: {},
            dismissedTips: {}
        });
    }, []);

    // Check if a page tour has been completed
    const isPageTourCompleted = useCallback((pageId) => {
        return !!tutorialState.completedPageTours[pageId];
    }, [tutorialState.completedPageTours]);

    // Check if a tip has been dismissed
    const isTipDismissed = useCallback((tipId) => {
        return !!tutorialState.dismissedTips[tipId];
    }, [tutorialState.dismissedTips]);

    const value = {
        tutorialState,
        completeOnboarding,
        completePageTour,
        dismissTip,
        resetTutorials,
        isPageTourCompleted,
        isTipDismissed
    };

    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    );
};
