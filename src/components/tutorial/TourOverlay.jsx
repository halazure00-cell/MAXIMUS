import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

/**
 * TourOverlay - Lightweight custom tour component
 * Features:
 * - Highlights target elements with data-tour attributes
 * - Scrolls targets into view
 * - Tooltip with title + description
 * - Controls: Next, Back, Skip, Done
 * - ESC key closes tour
 * - Handles missing selectors gracefully (skips silently)
 * - Adapts to dark/light mode automatically
 */
export default function TourOverlay({ steps = [], onComplete, onSkip }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const overlayRef = useRef(null);

    const step = steps[currentStep];

    // Find target element and calculate position
    const updateTargetPosition = useCallback(() => {
        if (!step?.selector) {
            setTargetRect(null);
            return;
        }

        const element = document.querySelector(`[data-tour="${step.selector}"]`);
        if (!element) {
            // Silently skip if element not found
            setTargetRect(null);
            return;
        }

        const rect = element.getBoundingClientRect();
        setTargetRect(rect);

        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Calculate tooltip position
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const padding = 16;

        let top = rect.bottom + padding;
        let left = rect.left;

        // Adjust if tooltip goes off-screen
        if (top + tooltipHeight > window.innerHeight) {
            top = rect.top - tooltipHeight - padding;
        }

        if (left + tooltipWidth > window.innerWidth) {
            left = window.innerWidth - tooltipWidth - padding;
        }

        if (left < padding) {
            left = padding;
        }

        setTooltipPosition({ top, left });
    }, [step]);

    useEffect(() => {
        updateTargetPosition();
        window.addEventListener('resize', updateTargetPosition);
        return () => window.removeEventListener('resize', updateTargetPosition);
    }, [updateTargetPosition]);

    // Handle ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleSkip();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        if (onSkip) onSkip();
    };

    const handleComplete = () => {
        if (onComplete) onComplete();
    };

    if (!step) return null;

    return (
        <AnimatePresence>
            <div
                ref={overlayRef}
                className="fixed inset-0 z-[9999]"
                style={{ pointerEvents: 'auto' }}
            >
                {/* Dark overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60"
                    onClick={handleSkip}
                />

                {/* Highlight area (cut-out) */}
                {targetRect && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute border-2 border-ui-primary rounded-lg shadow-lg pointer-events-none"
                        style={{
                            top: targetRect.top - 4,
                            left: targetRect.left - 4,
                            width: targetRect.width + 8,
                            height: targetRect.height + 8,
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                        }}
                    />
                )}

                {/* Tooltip */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bg-ui-surface border border-ui-border rounded-ui-xl shadow-ui-lg p-5 max-w-sm"
                    style={{
                        top: tooltipPosition.top,
                        left: tooltipPosition.left,
                        zIndex: 10000,
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-3 right-3 text-ui-muted hover:text-ui-text transition-colors"
                        aria-label="Close tutorial"
                    >
                        <X size={18} />
                    </button>

                    {/* Step counter */}
                    <div className="text-xs text-ui-muted mb-2">
                        {currentStep + 1} / {steps.length}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-ui-text mb-2">
                        {step.title}
                    </h3>

                    {/* Body */}
                    <p className="text-sm text-ui-text-secondary mb-4 leading-relaxed">
                        {step.body}
                    </p>

                    {/* Controls */}
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={handleSkip}
                            className="text-sm text-ui-muted hover:text-ui-text transition-colors flex items-center gap-1"
                        >
                            <SkipForward size={14} />
                            Lewati
                        </button>

                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={handleBack}
                                    className="px-3 py-2 text-sm text-ui-text bg-ui-surface-muted hover:bg-ui-border rounded-ui-lg transition-colors flex items-center gap-1"
                                >
                                    <ChevronLeft size={14} />
                                    Kembali
                                </button>
                            )}

                            <button
                                onClick={handleNext}
                                className="px-4 py-2 text-sm bg-ui-primary text-ui-background hover:bg-ui-primary/90 rounded-ui-lg transition-colors flex items-center gap-1 font-medium"
                            >
                                {currentStep === steps.length - 1 ? 'Selesai' : 'Lanjut'}
                                {currentStep < steps.length - 1 && <ChevronRight size={14} />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
