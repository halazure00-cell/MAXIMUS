import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Car, Settings as SettingsIcon, Moon, Sun, ChevronDown, Cloud } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabaseClient';
import Card from './Card';
import PrimaryButton from './PrimaryButton';
import SectionTitle from './SectionTitle';

export default function ProfileSettings({ showToast }) {
    const { settings, updateSettings, session } = useSettings();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncPending, setSyncPending] = useState(false);
    const settingsRef = useRef(settings);
    const saveTimeoutRef = useRef(null);
    const pendingSettingsRef = useRef(null);
    const inFlightRef = useRef(false);
    const syncToastShownRef = useRef(false);

    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Fetch profile from Supabase on mount
    useEffect(() => {
        const fetchProfile = async () => {
            if (!session?.user) return;

            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') { // PGRST116: JSON object requested, multiple (or no) rows returned
                    if (showToast) {
                        showToast(`Gagal memuat profil: ${error.message}`, 'error');
                    }
                }

                if (data) {
                    // Update local context with cloud data
                    updateSettings({
                        vehicleType: data.vehicle_type ?? settings.vehicleType,
                        dailyTarget: data.daily_target ?? settings.dailyTarget,
                        driverName: data.full_name ?? settings.driverName,
                        defaultCommission: data.default_commission ?? settings.defaultCommission,
                        fuelEfficiency: data.fuel_efficiency ?? settings.fuelEfficiency,
                        maintenanceFee: data.maintenance_fee ?? settings.maintenanceFee,
                        darkMode: data.dark_mode ?? settings.darkMode,
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [session, updateSettings]); // Careful: updateSettings should be stable

    const flushSave = useCallback(async () => {
        if (!session || !session.user) {
            if (showToast) {
                showToast('Sesi tidak ditemukan. Silakan login ulang.', 'error');
            }
            pendingSettingsRef.current = null;
            setSyncPending(false);
            syncToastShownRef.current = false;
            return;
        }
        if (inFlightRef.current) return;
        const nextSettings = pendingSettingsRef.current;
        if (!nextSettings) {
            setSyncPending(false);
            syncToastShownRef.current = false;
            return;
        }
        inFlightRef.current = true;
        pendingSettingsRef.current = null;
        setSaving(true);
        const full_name = nextSettings.driverName ?? '';
        const updates = {
            id: session.user.id,
            username: nextSettings.username || null,
            full_name,
            updated_at: new Date().toISOString(),
            vehicle_type: nextSettings.vehicleType || 'motor',
            daily_target: parseFloat(nextSettings.dailyTarget) || 0,
            default_commission: parseFloat(nextSettings.defaultCommission) || 0.10,
            fuel_efficiency: parseFloat(nextSettings.fuelEfficiency) || 0,
            maintenance_fee: parseFloat(nextSettings.maintenanceFee) || 0,
            dark_mode: Boolean(nextSettings.darkMode)
        };

        try {
            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) {
                if (showToast) {
                    showToast(`Gagal menyimpan profil: ${error.message}`, 'error');
                }
                console.error('Profile upsert error:', error);
                return;
            }
            if (showToast) showToast('Profil tersimpan di Cloud', 'success');
        } catch (error) {
            if (showToast) {
                showToast('Gagal menyimpan profil', 'error');
            }
        } finally {
            inFlightRef.current = false;
            setSaving(false);
            if (pendingSettingsRef.current) {
                setSyncPending(true);
                saveTimeoutRef.current = setTimeout(() => {
                    flushSave();
                }, 0);
            } else {
                setSyncPending(false);
                syncToastShownRef.current = false;
            }
        }
    }, [session, showToast]);

    // Debounced save to Supabase
    const saveToCloud = useCallback((newSettings) => {
        pendingSettingsRef.current = newSettings;
        setSyncPending(true);
        if (inFlightRef.current && showToast && !syncToastShownRef.current) {
            showToast('Perubahan terakhir sedang disinkronkan', 'info');
            syncToastShownRef.current = true;
        }
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            flushSave();
        }, 1000);
    }, [flushSave, showToast]);

    // Wrapper to update both Local Context and Cloud
    const handleUpdate = (updates) => {
        const nextSettings = { ...settingsRef.current, ...updates };
        updateSettings(updates);
        // Merge current settings with updates for the cloud save
        saveToCloud(nextSettings);
    };

    // Vehicle presets to auto-fill efficiency
    const vehiclePresets = {
        'matic_kecil': { label: 'Matic Kecil (Beat/Mio)', efficiency: 200 },
        'matic_besar': { label: 'Matic Besar (NMAX/PCX)', efficiency: 350 },
        'bebek': { label: 'Motor Bebek', efficiency: 250 },
        'sport': { label: 'Motor Sport', efficiency: 400 },
    };

    // Handler for vehicle type change to auto-update efficiency
    const handleVehicleChange = (e) => {
        const type = e.target.value;
        const preset = vehiclePresets[type];

        handleUpdate({
            vehicleType: type,
            fuelEfficiency: preset ? preset.efficiency : settings.fuelEfficiency
        });
    };

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(value);

    return (
        <div className="flex flex-col w-full h-full bg-ui-background">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4 pb-8 box-border w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 gap-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <div className="bg-ui-primary-soft p-2 rounded-ui-lg flex-shrink-0">
                            <User className="w-5 h-5 sm:w-6 sm:h-6 text-ui-text" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-ui-text font-display truncate">Profil Saya</h1>
                    </div>
                    {(saving || syncPending) && (
                        <span className="text-xs text-ui-muted flex items-center animate-pulse flex-shrink-0">
                            <Cloud className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">{saving && !syncPending ? 'Menyimpan...' : 'Sinkronisasi...'}</span>
                        </span>
                    )}
                </div>

            {/* A. Driver Profile */}
            <Card className="p-4 sm:p-5 space-y-4">
                <SectionTitle className="mb-2 flex items-center gap-2 text-base sm:text-lg">
                    <User className="w-4 h-4" /> Data Driver
                </SectionTitle>

                <div>
                    <label htmlFor="driver-name" className="block text-xs font-medium text-ui-muted mb-1.5">Nama Panggilan</label>
                    <input
                        id="driver-name"
                        name="driverName"
                        type="text"
                        value={settings.driverName}
                        onChange={(e) => handleUpdate({ driverName: e.target.value })}
                        placeholder="Contoh: Bang Jago"
                        className="w-full p-3 sm:p-4 rounded-ui-lg border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none transition-all bg-ui-surface text-ui-text placeholder:text-ui-muted"
                        style={{
                            fontSize: 'max(16px, 1rem)',
                            minHeight: '48px',
                            touchAction: 'manipulation'
                        }}
                        autoComplete="name"
                    />
                </div>

                <div>
                    <label htmlFor="daily-target" className="block text-xs font-medium text-ui-muted mb-1.5">Target Pendapatan Harian (Rp)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-muted pointer-events-none" style={{ fontSize: 'max(16px, 1rem)' }}>Rp</span>
                        <input
                            id="daily-target"
                            name="dailyTarget"
                            type="number"
                            value={settings.dailyTarget}
                            onChange={(e) => handleUpdate({ dailyTarget: parseInt(e.target.value) || 0 })}
                            placeholder="200000"
                            className="w-full p-3 sm:p-4 pl-10 rounded-ui-lg border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none transition-all bg-ui-surface text-ui-text placeholder:text-ui-muted"
                            style={{
                                fontSize: 'max(16px, 1rem)',
                                minHeight: '48px',
                                touchAction: 'manipulation'
                            }}
                            inputMode="numeric"
                            autoComplete="off"
                        />
                    </div>
                    <p className="text-[10px] text-ui-muted mt-1.5 text-right">
                        Target saat ini: <span className="font-semibold text-ui-text">Rp {formatCurrency(settings.dailyTarget)}</span>
                    </p>
                </div>
            </Card>

            {/* B. Vehicle Config */}
            <Card className="p-4 sm:p-5 space-y-4">
                <SectionTitle className="mb-2 flex items-center gap-2 text-base sm:text-lg">
                    <Car className="w-4 h-4" /> Kendaraan
                </SectionTitle>

                <div>
                    <label htmlFor="vehicle-type" className="block text-xs font-medium text-ui-muted mb-1.5">Jenis Motor</label>
                    <div className="relative">
                        <select
                            id="vehicle-type"
                            name="vehicleType"
                            value={settings.vehicleType}
                            onChange={handleVehicleChange}
                            className="w-full p-3 sm:p-4 pr-10 rounded-ui-lg border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none transition-all appearance-none bg-ui-surface text-ui-text"
                            style={{
                                fontSize: 'max(16px, 1rem)',
                                minHeight: '48px',
                                touchAction: 'manipulation'
                            }}
                            autoComplete="off"
                        >
                            {Object.entries(vehiclePresets).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ui-muted pointer-events-none" />
                    </div>
                </div>

                <div>
                    <label htmlFor="fuel-efficiency" className="block text-xs font-medium text-ui-muted mb-1.5">Konsumsi BBM (Rp/KM)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-muted pointer-events-none" style={{ fontSize: 'max(16px, 1rem)' }}>Rp</span>
                        <input
                            id="fuel-efficiency"
                            name="fuelEfficiency"
                            type="number"
                            value={settings.fuelEfficiency}
                            onChange={(e) => handleUpdate({ fuelEfficiency: parseInt(e.target.value) || 0 })}
                            placeholder="200"
                            className="w-full p-3 sm:p-4 pl-10 pr-14 rounded-ui-lg border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none transition-all bg-ui-surface text-ui-text placeholder:text-ui-muted"
                            style={{
                                fontSize: 'max(16px, 1rem)',
                                minHeight: '48px',
                                touchAction: 'manipulation'
                            }}
                            inputMode="numeric"
                            autoComplete="off"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-muted pointer-events-none" style={{ fontSize: '14px' }}>/ km</span>
                    </div>
                </div>

                <div>
                    <label htmlFor="maintenance-fee" className="block text-xs font-medium text-ui-muted mb-1.5">Prediksi Biaya Service (Rp/Order)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-muted pointer-events-none" style={{ fontSize: 'max(16px, 1rem)' }}>Rp</span>
                        <input
                            id="maintenance-fee"
                            name="maintenanceFee"
                            type="number"
                            value={settings.maintenanceFee ?? 500}
                            onChange={(e) => handleUpdate({ maintenanceFee: parseInt(e.target.value) || 0 })}
                            placeholder="500"
                            className="w-full p-3 sm:p-4 pl-10 pr-16 rounded-ui-lg border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none transition-all bg-ui-surface text-ui-text placeholder:text-ui-muted"
                            style={{
                                fontSize: 'max(16px, 1rem)',
                                minHeight: '48px',
                                touchAction: 'manipulation'
                            }}
                            inputMode="numeric"
                            autoComplete="off"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-muted pointer-events-none" style={{ fontSize: '14px' }}>/ order</span>
                    </div>
                </div>
            </Card>

            {/* C. App Preferences */}
            <Card className="p-4 sm:p-5 space-y-4">
                <SectionTitle className="mb-2 flex items-center gap-2 text-base sm:text-lg">
                    <SettingsIcon className="w-4 h-4" /> Preferensi
                </SectionTitle>

                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-ui-text">Potongan Default</div>
                        <div className="text-xs text-ui-muted">Otomatis saat buka app</div>
                    </div>
                    <div className="flex bg-ui-surface-muted rounded-ui-lg p-1 flex-shrink-0">
                        <button
                            onClick={() => handleUpdate({ defaultCommission: 0.10 })}
                            className={`px-3 sm:px-4 py-2 rounded-ui-md text-xs sm:text-sm font-medium transition-all press-effect min-h-[36px] ${settings.defaultCommission === 0.10 ? 'bg-ui-surface shadow-ui-sm text-ui-text' : 'text-ui-muted'}`}
                        >
                            10%
                        </button>
                        <button
                            onClick={() => handleUpdate({ defaultCommission: 0.15 })}
                            className={`px-3 sm:px-4 py-2 rounded-ui-md text-xs sm:text-sm font-medium transition-all press-effect min-h-[36px] ${settings.defaultCommission === 0.15 ? 'bg-ui-surface shadow-ui-sm text-ui-text' : 'text-ui-muted'}`}
                        >
                            15%
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-ui-border/60 gap-3">
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-ui-text">Mode Gelap</div>
                        <div className="text-xs text-ui-muted">Ramah mata malam hari</div>
                    </div>
                    <button
                        onClick={() => handleUpdate({ darkMode: !settings.darkMode })}
                        className={`w-14 h-8 rounded-full transition-colors relative press-effect flex-shrink-0 min-h-[44px] flex items-center ${settings.darkMode ? 'bg-ui-primary' : 'bg-ui-border'}`}
                    >
                        <div className={`w-6 h-6 rounded-full bg-ui-surface shadow-ui-sm absolute transition-transform transform flex items-center justify-center ${settings.darkMode ? 'translate-x-7' : 'translate-x-1'}`}>
                            {settings.darkMode ? <Moon className="w-3 h-3 text-ui-text" /> : <Sun className="w-3 h-3 text-ui-warning" />}
                        </div>
                    </button>
                </div>
            </Card>

            <div className="text-center mt-4 pb-4">
                <p className="text-[10px] text-ui-muted mb-3">Maximus Driver (Cloud Sync) v1.3</p>
                <PrimaryButton
                    type="button"
                    className="bg-ui-danger text-ui-inverse hover:bg-ui-danger/90 press-effect w-full min-h-[48px] sm:max-w-xs sm:mx-auto"
                    onClick={() => supabase.auth.signOut()}
                >
                    Keluar (Sign Out)
                </PrimaryButton>
            </div>
            </div>
        </div>
    );
}
