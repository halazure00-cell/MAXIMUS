import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calculator, Map, History, User } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * BottomNavigation - Simple fixed bottom navigation
 * Uses Link components for navigation (most reliable)
 */

const NAV_ITEMS = [
    { path: '/', label: 'Hitung', icon: Calculator },
    { path: '/map', label: 'Peta', icon: Map },
    { path: '/history', label: 'Riwayat', icon: History },
    { path: '/profile', label: 'Profil', icon: User },
];

const BottomNavigation = () => {
    const location = useLocation();
    const [clickedPath, setClickedPath] = useState(null);

    const handleLinkClick = (path) => {
        setClickedPath(path);
        setTimeout(() => setClickedPath(null), 300);
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
                backgroundColor: 'var(--ui-color-surface, #ffffff)',
                borderTop: '1px solid var(--ui-color-border, #e5e7eb)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                isolation: 'isolate',
                contain: 'layout style'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    height: '64px',
                    width: '100%'
                }}
            >
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;
                    const wasClicked = clickedPath === item.path;
                    const IconComponent = item.icon;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => handleLinkClick(item.path)}
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
                                gap: '4px',
                                background: wasClicked ? 'rgba(0,0,0,0.05)' : 'transparent',
                                textDecoration: 'none',
                                padding: '8px',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'rgba(0,0,0,0.1)',
                                outline: 'none',
                                position: 'relative',
                                transition: 'background-color 0.15s ease',
                                color: isActive 
                                    ? 'var(--ui-color-text, #1f2937)' 
                                    : 'var(--ui-color-muted, #6b7280)'
                            }}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: '20%',
                                        right: '20%',
                                        height: '3px',
                                        backgroundColor: 'var(--ui-color-primary, #ffd54a)',
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

                            {/* Icon */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    backgroundColor: isActive 
                                        ? 'var(--ui-color-primary, #ffd54a)' 
                                        : 'transparent',
                                    transition: 'background-color 0.15s ease',
                                    pointerEvents: 'none'
                                }}
                            >
                                <IconComponent
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    style={{ pointerEvents: 'none' }}
                                />
                            </div>

                            {/* Label */}
                            <span
                                style={{
                                    fontSize: '11px',
                                    fontWeight: isActive ? 600 : 500,
                                    lineHeight: 1,
                                    pointerEvents: 'none'
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
