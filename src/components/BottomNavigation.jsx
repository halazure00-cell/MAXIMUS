import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calculator, Map, History, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const navItems = [
        { path: '/', label: 'Hitung', icon: Calculator },
        { path: '/map', label: 'Peta', icon: Map },
        { path: '/history', label: 'Riwayat', icon: History },
        { path: '/profile', label: 'Profil', icon: User },
    ];

    const handleNavClick = (path) => {
        navigate(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-ui-surface border-t border-ui-border pb-safe z-[9999]" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            pointerEvents: 'auto'
        }}>
            <div className="flex justify-around items-center h-16 relative" style={{pointerEvents: 'auto'}}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    
                    return (
                        <button
                            key={item.path}
                            onClick={() => handleNavClick(item.path)}
                            type="button"
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 group relative cursor-pointer ${isActive ? 'text-ui-text' : 'text-ui-muted hover:text-ui-text'}`}
                            style={{
                                pointerEvents: 'auto',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer'
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
                            <div className={`p-1.5 rounded-ui-lg transition-colors duration-200 ${isActive ? 'bg-ui-primary' : 'bg-transparent group-hover:bg-ui-surface-muted'}`} style={{pointerEvents: 'auto'}}>
                                <item.icon className={`w-6 h-6 ${isActive ? 'text-ui-text' : 'currentColor'}`} strokeWidth={2} />
                            </div>
                            <span className={`text-xs font-medium transition-all duration-200 ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavigation;
