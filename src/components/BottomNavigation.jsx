import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calculator, Map, History, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [portalContainer, setPortalContainer] = useState(null);
    
    const navItems = [
        { path: '/', label: 'Hitung', icon: Calculator },
        { path: '/map', label: 'Peta', icon: Map },
        { path: '/history', label: 'Riwayat', icon: History },
        { path: '/profile', label: 'Profil', icon: User },
    ];

    // Create portal container on mount
    useEffect(() => {
        let container = document.getElementById('bottom-nav-portal');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bottom-nav-portal';
            container.style.cssText = 'position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999; pointer-events: auto;';
            document.body.appendChild(container);
        }
        setPortalContainer(container);
        
        return () => {
            // Don't remove on unmount as other instances might use it
        };
    }, []);

    const handleNavClick = (e, path) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(path);
    };

    const navContent = (
        <nav 
            className="bg-ui-surface border-t border-ui-border pb-safe"
            style={{
                position: 'relative',
                width: '100%',
                backgroundColor: 'var(--ui-color-surface, #ffffff)',
                borderTop: '1px solid var(--ui-color-border, #e5e7eb)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                pointerEvents: 'auto',
                touchAction: 'manipulation'
            }}
        >
            <div 
                className="flex justify-around items-center h-16"
                style={{ pointerEvents: 'auto' }}
            >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const IconComponent = item.icon;
                    
                    return (
                        <button
                            key={item.path}
                            onClick={(e) => handleNavClick(e, item.path)}
                            type="button"
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 group relative ${isActive ? 'text-ui-text' : 'text-ui-muted hover:text-ui-text'}`}
                            style={{
                                pointerEvents: 'auto',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent'
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute -top-[1px] left-0 right-0 h-[2px] bg-ui-primary w-1/2 mx-auto rounded-full"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <div 
                                className={`p-1.5 rounded-ui-lg transition-colors duration-200 ${isActive ? 'bg-ui-primary' : 'bg-transparent group-hover:bg-ui-surface-muted'}`}
                                style={{ pointerEvents: 'none' }}
                            >
                                <IconComponent className={`w-6 h-6 ${isActive ? 'text-ui-text' : ''}`} strokeWidth={2} />
                            </div>
                            <span 
                                className={`text-xs font-medium transition-all duration-200 ${isActive ? 'font-bold' : ''}`}
                                style={{ pointerEvents: 'none' }}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );

    // Use portal to render outside of the main app DOM tree
    if (!portalContainer) {
        return null;
    }

    return createPortal(navContent, portalContainer);
};

export default BottomNavigation;
