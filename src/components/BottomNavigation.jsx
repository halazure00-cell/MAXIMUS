import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calculator, Map, History, User } from 'lucide-react';
import { motion } from 'framer-motion';

// Singleton portal container - created once, reused always
let portalRoot = null;
const getPortalRoot = () => {
    if (!portalRoot) {
        portalRoot = document.createElement('div');
        portalRoot.id = 'bottom-nav-portal';
        portalRoot.setAttribute('data-navigation', 'true');
        document.body.appendChild(portalRoot);
    }
    return portalRoot;
};

const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const containerRef = useRef(getPortalRoot());
    
    const navItems = [
        { path: '/', label: 'Hitung', icon: Calculator },
        { path: '/map', label: 'Peta', icon: Map },
        { path: '/history', label: 'Riwayat', icon: History },
        { path: '/profile', label: 'Profil', icon: User },
    ];

    // Direct click handler on button - simplest approach
    const onNavClick = (path) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(path);
    };

    const navContent = (
        <nav 
            id="main-bottom-nav"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 2147483647, // Maximum z-index
                backgroundColor: 'var(--ui-color-surface, #ffffff)',
                borderTop: '1px solid var(--ui-color-border, #e5e7eb)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                isolation: 'isolate'
            }}
        >
            <div 
                style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    height: '64px',
                    pointerEvents: 'auto'
                }}
            >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const IconComponent = item.icon;
                    
                    return (
                        <button
                            key={item.path}
                            data-nav-path={item.path}
                            onClick={onNavClick(item.path)}
                            onTouchEnd={onNavClick(item.path)}
                            type="button"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '25%',
                                height: '100%',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                userSelect: 'none',
                                color: isActive ? 'var(--ui-color-text)' : 'var(--ui-color-muted)'
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    style={{
                                        position: 'absolute',
                                        top: '-1px',
                                        left: '25%',
                                        right: '25%',
                                        height: '2px',
                                        backgroundColor: 'var(--ui-color-primary)',
                                        borderRadius: '9999px'
                                    }}
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <div 
                                style={{
                                    padding: '6px',
                                    borderRadius: '8px',
                                    backgroundColor: isActive ? 'var(--ui-color-primary)' : 'transparent',
                                    pointerEvents: 'none'
                                }}
                            >
                                <IconComponent 
                                    style={{ 
                                        width: '24px', 
                                        height: '24px',
                                        pointerEvents: 'none'
                                    }} 
                                    strokeWidth={2} 
                                />
                            </div>
                            <span 
                                style={{
                                    fontSize: '12px',
                                    fontWeight: isActive ? 700 : 500,
                                    pointerEvents: 'none'
                                }}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );

    return createPortal(navContent, containerRef.current);
};

export default BottomNavigation;
