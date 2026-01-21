import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTutorial } from '../../context/TutorialContext';

/**
 * Microtip - Small contextual tooltip shown only once
 * Features:
 * - Shows only the first time user encounters the element
 * - Dismissible
 * - Adapts to dark/light mode
 * - Never shown again once dismissed
 */
export default function Microtip({ id, title, description, children, placement = 'bottom' }) {
    const { isTipDismissed, dismissTip } = useTutorial();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show tip if it hasn't been dismissed
        if (!isTipDismissed(id)) {
            // Small delay for better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [id, isTipDismissed]);

    const handleDismiss = () => {
        setIsVisible(false);
        dismissTip(id);
    };

    if (isTipDismissed(id)) {
        return children;
    }

    const placementStyles = {
        top: 'bottom-full mb-2',
        bottom: 'top-full mt-2',
        left: 'right-full mr-2',
        right: 'left-full ml-2',
    };

    return (
        <div className="relative inline-block">
            {children}
            
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute z-50 ${placementStyles[placement]}`}
                        style={{ minWidth: '200px', maxWidth: '280px' }}
                    >
                        <div className="bg-ui-surface border border-ui-primary rounded-ui-lg shadow-ui-lg p-3">
                            {/* Close button */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-2 right-2 text-ui-muted hover:text-ui-text transition-colors"
                                aria-label="Dismiss tip"
                            >
                                <X size={14} />
                            </button>

                            {/* Title */}
                            {title && (
                                <h4 className="text-sm font-semibold text-ui-text mb-1 pr-5">
                                    {title}
                                </h4>
                            )}

                            {/* Description */}
                            <p className="text-xs text-ui-text-secondary leading-relaxed">
                                {description}
                            </p>

                            {/* Arrow */}
                            <div 
                                className={`absolute w-2 h-2 bg-ui-surface border-ui-primary rotate-45 ${
                                    placement === 'bottom' ? 'border-t border-l -top-1 left-4' :
                                    placement === 'top' ? 'border-b border-r -bottom-1 left-4' :
                                    placement === 'right' ? 'border-t border-r -left-1 top-4' :
                                    'border-b border-l -right-1 top-4'
                                }`}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
