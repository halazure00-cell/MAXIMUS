import React, { useEffect, useState, useCallback, useRef } from 'react';
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
        <div className="flex flex-col min-h-full bg-ui-background">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <div className="bg-ui-primary-soft p-2 rounded-ui-lg">
                            <User className="w-6 h-6 text-ui-text" />
                        </div>
                        <h1 className="text-2xl font-bold text-ui-text font-display">Profil Saya</h1>
                    </div>
                    {(saving || syncPending) && (
                        <span className="text-xs text-ui-muted flex items-center animate-pulse">
                            <Cloud className="w-3 h-3 mr-1" />
                            {saving && !syncPending ? 'Menyimpan...' : 'Sinkronisasi...'}
                        </span>
                    )}
                </div>

            {/* A. Driver Profile */}
            <Card className="p-5 space-y-4">
                <SectionTitle className="mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> Data Driver
                </SectionTitle>

                <div>
                    <label className="block text-xs font-medium text-ui-muted mb-1.5">Nama Panggilan</label>
                    <input
                        type="text"
                        value={settings.driverName}
                        onChange={(e) => handleUpdate({ driverName: e.target.value })}
                        placeholder="Contoh: Bang Jago"
                        className="w-full text-base p-3 rounded-ui-lg border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none transition-all bg-ui-surface text-ui-text placeholder:text-ui-muted"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-ui-muted mb-1.5">Target Pendapatan Harian (Rp)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-ui-muted">Rp</span>
                        <input
                            type="number"
                            value={settings.dailyTarget}
                            onChange={(e) => handleUpdate({ dailyTarget: parseInt(e.target.value) || 0 })}
                            placeholder="200000"
                            className="w-full text-base p-3 pl-10 rounded-ui-lg border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none transition-all bg-ui-surface text-ui-text placeholder:text-ui-muted"
                            inputMode="numeric"
                        />
                    </div>
                    <p className="text-[10px] text-ui-muted mt-1.5 text-right">
                        Target saat ini: <span className="font-semibold text-ui-text">Rp {formatCurrency(settings.dailyTarget)}</span>
                    </p>
                </div>
            </Card>

            {/* B. Vehicle Config */}
            <Card className="p-5 space-y-4">
                <SectionTitle className="mb-2 flex items-center gap-2">
                    <Car className="w-4 h-4" /> Kendaraan
                </SectionTitle>

                <div>
                    <label className="block text-xs font-medium text-ui-muted mb-1.5">Jenis Motor</label>
                    <div className="relative">
                        <select
                            value={settings.vehicleType}
                            onChange={handleVehicleChange}
                            className="w-full text-base p-3 pr-10 rounded-ui-lg border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none transition-all appearance-none bg-ui-surface text-ui-text"
                        >
                            {Object.entries(vehiclePresets).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-ui-muted pointer-events-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-ui-muted mb-1.5">Konsumsi BBM (Rp/KM)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-ui-muted">Rp</span>
                        <input
                            type="number"
                            value={settings.fuelEfficiency}
                            onChange={(e) => handleUpdate({ fuelEfficiency: parseInt(e.target.value) || 0 })}
                            placeholder="200"
                            className="w-full text-base p-3 pl-10 pr-14 rounded-ui-lg border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none transition-all bg-ui-surface text-ui-text placeholder:text-ui-muted"
                            inputMode="numeric"
                        />
                        <span className="absolute right-3 top-3 text-ui-muted text-sm">/ km</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-ui-muted mb-1.5">Prediksi Biaya Service (Rp/Order)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-ui-muted">Rp</span>
                        <input
                            type="number"
                            value={settings.maintenanceFee ?? 500}
                            onChange={(e) => handleUpdate({ maintenanceFee: parseInt(e.target.value) || 0 })}
                            placeholder="500"
                            className="w-full text-base p-3 pl-10 pr-16 rounded-ui-lg border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none transition-all bg-ui-surface text-ui-text placeholder:text-ui-muted"
                            inputMode="numeric"
                        />
                        <span className="absolute right-3 top-3 text-ui-muted text-sm">/ order</span>
                    </div>
                </div>
            </Card>

            {/* C. App Preferences */}
            <Card className="p-5 space-y-4">
                <SectionTitle className="mb-2 flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" /> Preferensi
                </SectionTitle>

                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold text-ui-text">Potongan Default</div>
                        <div className="text-xs text-ui-muted">Otomatis terpilih saat buka aplikasi</div>
                    </div>
                    <div className="flex bg-ui-surface-muted rounded-ui-lg p-1">
                        <button
                            onClick={() => handleUpdate({ defaultCommission: 0.10 })}
                            className={`px-4 py-2 rounded-ui-md text-xs font-medium transition-all press-effect ${settings.defaultCommission === 0.10 ? 'bg-ui-surface shadow-ui-sm text-ui-text' : 'text-ui-muted'}`}
                        >
                            10%
                        </button>
                        <button
                            onClick={() => handleUpdate({ defaultCommission: 0.15 })}
                            className={`px-4 py-2 rounded-ui-md text-xs font-medium transition-all press-effect ${settings.defaultCommission === 0.15 ? 'bg-ui-surface shadow-ui-sm text-ui-text' : 'text-ui-muted'}`}
                        >
                            15%
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-ui-border/60">
                    <div>
                        <div className="text-sm font-bold text-ui-text">Mode Gelap</div>
                        <div className="text-xs text-ui-muted">Tampilan ramah mata malam hari</div>
                    </div>
                    <button
                        onClick={() => handleUpdate({ darkMode: !settings.darkMode })}
                        className={`w-14 h-8 rounded-full transition-colors relative press-effect ${settings.darkMode ? 'bg-ui-primary' : 'bg-ui-border'}`}
                    >
                        <div className={`w-6 h-6 rounded-full bg-ui-surface shadow-ui-sm absolute top-1 transition-transform transform flex items-center justify-center ${settings.darkMode ? 'translate-x-7' : 'translate-x-1'}`}>
                            {settings.darkMode ? <Moon className="w-3 h-3 text-ui-text" /> : <Sun className="w-3 h-3 text-ui-warning" />}
                        </div>
                    </button>
                </div>
            </Card>

            <div className="text-center mt-4 pb-4">
                <p className="text-[10px] text-ui-muted mb-3">Maximus Driver (Cloud Sync) v1.3</p>
                <PrimaryButton
                    type="button"
                    className="bg-ui-danger text-ui-inverse hover:bg-ui-danger/90 press-effect"
                    onClick={() => supabase.auth.signOut()}
                >
                    Keluar (Sign Out)
                </PrimaryButton>
            </div>
            </div>
        </div>
    );
}
