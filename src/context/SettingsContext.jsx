import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    // Initial state with defaults
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('maximus_settings');
        const now = new Date();
        const autoDarkMode = now.getHours() >= 18 || now.getHours() < 6;

        if (saved) {
            try {
                return { ...JSON.parse(saved) };
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
            maintenanceFee: 500, // Default fee
            darkMode: autoDarkMode // Gap Fix 3: Auto Dark Mode
        };
    });

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    // Initial session check
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Gap Fix 3: Sync Dark Mode with Tailwind
    useEffect(() => {
        if (settings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [settings.darkMode]);

    // Fetch from Supabase when session becomes available
    useEffect(() => {
        if (!session) {
            setProfile(null);
            return;
        }

        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (data && !error) {
                // Store full profile data including subscription info
                setProfile(data);
                
                // Merge Supabase data into settings, using fallback for missing fields
                setSettings(prev => ({
                    ...prev,
                    driverName: data.full_name ?? prev.driverName,
                    dailyTarget: data.daily_target ?? prev.dailyTarget,
                    vehicleType: data.vehicle_type ?? prev.vehicleType,
                    defaultCommission: data.default_commission ?? prev.defaultCommission,
                    fuelEfficiency: data.fuel_efficiency ?? prev.fuelEfficiency,
                    maintenanceFee: data.maintenance_fee ?? prev.maintenanceFee,
                    darkMode: data.dark_mode ?? prev.darkMode
                }));
            }
        };

        fetchProfile();
    }, [session]);

    // Persist to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem('maximus_settings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = useCallback((newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    // Helper to check if user has PRO subscription
    // Check both subscription_tier and expiry date
    const isPro = profile?.subscription_tier === 'pro' && 
                  (!profile?.subscription_expiry || new Date(profile.subscription_expiry) > new Date());

    const value = {
        settings,
        updateSettings,
        session,
        loading,
        profile,
        isPro
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
