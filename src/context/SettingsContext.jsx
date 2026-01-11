import { createContext, useState, useEffect, useContext } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    // Initial state with defaults
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('maximus_settings');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
        return {
            driverName: '',
            dailyTarget: 200000,
            vehicleType: 'matic_kecil',
            fuelEfficiency: 200, // Rp/KM default for beat/mio
            defaultCommission: 0.15, // 15% non-prioritas
            darkMode: false
        };
    });

    // Persist to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem('maximus_settings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const value = {
        settings,
        updateSettings
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
