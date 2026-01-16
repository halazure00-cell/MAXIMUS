import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calculator, Lightbulb, History, User } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * BottomNavigation - Mobile-first fixed bottom navigation
 * Enhanced with better touch targets and visual feedback
 */

const NAV_ITEMS = [
    { path: '/', label: 'Hitung', icon: Calculator },
    { path: '/insight', label: 'Insight', icon: Lightbulb },
    { path: '/history', label: 'Riwayat', icon: History },
    { path: '/profile', label: 'Profil', icon: User },
];

const BottomNavigation = () => {
    const location = useLocation();
    const [pressedPath, setPressedPath] = useState(null);

    const handlePressStart = (path) => {
        setPressedPath(path);
        // Haptic feedback with safety check
        try {
            if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                navigator.vibrate(10);
            }
        } catch {
            // Silently ignore if vibration fails
        }
    };

    const handlePressEnd = () => {
        setPressedPath(null);
    };

    return (
        <nav
            id="bottom-navigation"
            role="navigation"
            aria-label="Main navigation"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 999999,
                backgroundColor: 'var(--ui-color-surface)',
                borderTop: '1px solid var(--ui-color-border)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                isolation: 'isolate',
                contain: 'layout style',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    height: '64px',
                    width: '100%',
                    maxWidth: '500px',
                    margin: '0 auto',
                    padding: '0 8px'
                }}
            >
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;
                    const isPressed = pressedPath === item.path;
                    const IconComponent = item.icon;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onTouchStart={() => handlePressStart(item.path)}
                            onTouchEnd={handlePressEnd}
                            onMouseDown={() => handlePressStart(item.path)}
                            onMouseUp={handlePressEnd}
                            onMouseLeave={handlePressEnd}
                            role="tab"
                            aria-selected={isActive}
                            aria-label={item.label}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: '1',
                                height: '100%',
                                minHeight: '64px',
                                minWidth: '64px',
                                maxWidth: '96px',
                                gap: '2px',
                                background: 'transparent',
                                textDecoration: 'none',
                                padding: '6px 2px',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                outline: 'none',
                                position: 'relative',
                                transform: isPressed ? 'scale(0.92)' : 'scale(1)',
                                transition: 'transform 0.1s ease-out',
                                color: isActive 
                                    ? 'var(--ui-color-text)' 
                                    : 'var(--ui-color-muted)',
                                opacity: isPressed ? 0.7 : 1
                            }}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: '15%',
                                        right: '15%',
                                        height: '3px',
                                        backgroundColor: 'var(--ui-color-primary)',
                                        borderRadius: '0 0 4px 4px'
                                    }}
                                    initial={false}
                                    transition={{ 
                                        type: "spring", 
                                        stiffness: 400, 
                                        damping: 30 
                                    }}
                                />
                            )}

                            {/* Icon container with background */}
                            <motion.div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    backgroundColor: isActive 
                                        ? 'var(--ui-color-primary)' 
                                        : 'transparent',
                                    transition: 'background-color 0.2s ease',
                                    pointerEvents: 'none',
                                    minWidth: '48px',
                                    minHeight: '48px'
                                }}
                                animate={{
                                    scale: isActive ? 1 : 0.95
                                }}
                                transition={{ duration: 0.15 }}
                            >
                                <IconComponent
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    style={{ pointerEvents: 'none' }}
                                />
                            </motion.div>

                            {/* Label */}
                            <span
                                style={{
                                    fontSize: '11px',
                                    fontWeight: isActive ? 600 : 500,
                                    lineHeight: 1,
                                    pointerEvents: 'none',
                                    letterSpacing: isActive ? '0' : '-0.01em'
                                }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavigation;
