import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
    fetchStrategicSpots,
} from '../lib/db';
import { getCachedOrders, getCachedExpenses } from '../lib/localDb';
import { useSyncContext } from '../context/SyncContext';
import { watchLocation, haversineDistance, checkLocationPermission, getCurrentPosition } from '../lib/location';
import { createLogger } from '../lib/logger';

const logger = createLogger('Insight');
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Clock,
    Target,
    Flame,
    Coffee,
    MapPin,
    Navigation,
    Building2,
    Train,
    GraduationCap,
    Utensils,
    ShoppingBag,
    Users,
    ChevronDown,
    ChevronUp,
    BarChart2,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import {
    format,
    parseISO,
    isValid,
    getHours,
    getDay,
    subDays,
    differenceInDays,
    isSameDay
} from 'date-fns';
import Card from './Card';

/**
 * Insight Component - Clean & Fast UI for Ojol Drivers
 * Design Principles: Minimal, Scannable, Action-oriented
 */

// Tab Button Component
const TabButton = ({ active, onClick, children, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-3 px-2 text-xs font-semibold transition-all rounded-ui-lg flex items-center justify-center gap-1.5 press-effect ${
            active 
                ? 'bg-ui-primary text-ui-background shadow-sm' 
                : 'text-ui-muted hover:bg-ui-surface-muted active:bg-ui-primary/20'
        }`}
    >
        {Icon && <Icon size={14} />}
        {children}
    </button>
);

// Stat Pill Component
const StatPill = ({ label, value, trend, color = 'text-ui-text' }) => (
    <div className="flex flex-col items-center p-3 bg-ui-surface-muted rounded-ui-lg min-w-[80px]">
        <span className="text-[10px] text-ui-muted uppercase tracking-wide">{label}</span>
        <span className={`text-lg font-bold ${color}`}>{value}</span>
        {trend && (
            <span className={`text-[9px] flex items-center gap-0.5 ${trend > 0 ? 'text-ui-success' : 'text-ui-danger'}`}>
                {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(trend).toFixed(0)}%
            </span>
        )}
    </div>
);

// Spot Card Component
const SpotCard = ({ spot, isTop, onNavigate }) => {
    const getCategoryIcon = (category) => {
        const map = {
            'tourism/government': Building2,
            'transport': Train,
            'public-space': Users,
            'mall/tourism': ShoppingBag,
            'campus': GraduationCap,
            'campus/food': Utensils,
            'gateway': Navigation,
            'market': ShoppingBag,
            'corridor': Navigation,
        };
        return map[category] || MapPin;
    };

    const getCategoryLabel = (category) => {
        const map = {
            'tourism/government': 'Wisata & Pemerintahan',
            'transport': 'Transportasi Publik',
            'public-space': 'Area Publik',
            'mall/tourism': 'Pusat Belanja & Wisata',
            'campus': 'Kawasan Kampus',
            'campus/food': 'Kampus & Kuliner',
            'gateway': 'Akses Utama',
            'market': 'Pasar Tradisional',
            'corridor': 'Jalan Utama',
        };
        if (map[category]) return map[category];
        return category?.replace(/[/-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Lokasi Strategis';
    };
    
    const Icon = getCategoryIcon(spot.category);
    
    return (
        <motion.button
            onClick={onNavigate}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-4 rounded-ui-xl text-left transition-all ${
                isTop 
                    ? 'bg-gradient-to-r from-ui-danger/20 to-ui-warning/10 border-2 border-ui-danger/30' 
                    : 'bg-ui-surface-muted border border-ui-border'
            }`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-ui-lg ${isTop ? 'bg-ui-danger/20' : 'bg-ui-surface'}`}>
                    <Icon size={20} className={isTop ? 'text-ui-danger' : 'text-ui-muted'} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className={`font-bold truncate ${isTop ? 'text-ui-danger' : 'text-ui-text'}`}>
                            {spot.name}
                        </h3>
                        {isTop && (
                            <span className="text-[9px] font-bold bg-ui-danger text-white px-1.5 py-0.5 rounded">
                                HOT
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-ui-muted mt-0.5 truncate">
                        {getCategoryLabel(spot.category)}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    {spot.distance !== null && (
                        <div className="text-sm font-bold text-ui-text">{spot.distance.toFixed(1)} km</div>
                    )}
                    <div className="text-[10px] text-ui-muted flex items-center gap-1 justify-end">
                        <Clock size={10} />
                        {spot.hoursRemaining}j sisa
                    </div>
                </div>
            </div>
        </motion.button>
    );
};

export default function Insight({ showToast }) {
    const { session } = useSettings();
    const { isInitialized } = useSyncContext();
    const [orders, setOrders] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [strategicSpots, setStrategicSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('now');
    const [userLocation, setUserLocation] = useState(null);
    const [expandedSection, setExpandedSection] = useState(null);
    
    // Location state
    const [locationStatus, setLocationStatus] = useState('prompt'); // 'granted' | 'denied' | 'prompt' | 'unsupported' | 'error'
    const [locationError, setLocationError] = useState(null);
    
    // Data fetch error states for retry
    const [spotsError, setSpotsError] = useState(null);

    // Strategic spots caching with TTL (1 day)
    const SPOTS_CACHE_KEY = 'spots_v1';
    const SPOTS_CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day in milliseconds

    const getCachedSpots = useCallback(() => {
        try {
            const cached = localStorage.getItem(SPOTS_CACHE_KEY);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            
            if (age > SPOTS_CACHE_TTL) {
                localStorage.removeItem(SPOTS_CACHE_KEY);
                return null;
            }
            
            return data;
        } catch (error) {
            logger.warn('Failed to read cached spots', error);
            return null;
        }
    }, [SPOTS_CACHE_KEY, SPOTS_CACHE_TTL]);

    const setCachedSpots = useCallback((data) => {
        try {
            localStorage.setItem(SPOTS_CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now(),
            }));
        } catch (error) {
            logger.warn('Failed to cache spots', error);
        }
    }, [SPOTS_CACHE_KEY]);

    // Fetch data with robust error handling and AbortController
    useEffect(() => {
        if (!session?.user || !isInitialized) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let alive = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                setSpotsError(null);
                
                // Read transactions from local cache (last 30 days)
                const thirtyDaysAgo = subDays(new Date(), 30);
                const [ordersData, expensesData] = await Promise.all([
                    getCachedOrders(session.user.id)
                        .then(orders => {
                            // Filter to last 30 days and non-deleted
                            return orders.filter(o => {
                                if (o.deleted_at) return false;
                                const createdAt = new Date(o.created_at);
                                return createdAt >= thirtyDaysAgo;
                            });
                        })
                        .catch(err => { 
                            logger.error('Orders cache read error', err); 
                            return []; 
                        }),
                    getCachedExpenses(session.user.id)
                        .then(expenses => {
                            // Filter to last 30 days and non-deleted
                            return expenses.filter(e => {
                                if (e.deleted_at) return false;
                                const createdAt = new Date(e.created_at);
                                return createdAt >= thirtyDaysAgo;
                            });
                        })
                        .catch(err => { 
                            logger.error('Expenses cache read error', err); 
                            return []; 
                        }),
                ]);

                if (!alive) return;

                setOrders(ordersData);
                setExpenses(expensesData);
                logger.info('Loaded transactions from cache', { 
                    orders: ordersData.length, 
                    expenses: expensesData.length 
                });

                // Fetch strategic spots with caching
                const cachedSpots = getCachedSpots();
                if (cachedSpots) {
                    logger.info('Using cached strategic spots', { count: cachedSpots.length });
                    if (alive) setStrategicSpots(cachedSpots);
                } else {
                    // Fetch from Supabase and cache
                    try {
                        const spotsData = await fetchStrategicSpots({ signal: controller.signal });
                        if (alive) {
                            setStrategicSpots(spotsData);
                            setCachedSpots(spotsData);
                            logger.info('Fetched and cached strategic spots', { count: spotsData.length });
                        }
                    } catch (err) {
                        logger.error('Spots fetch error', err);
                        if (alive) setSpotsError(err.message || 'Gagal memuat spot');
                    }
                }
            } catch (error) {
                if (!alive) return;
                if (error.name === 'AbortError') return;
                logger.error('Critical Data Fetch Error', error);
                if (showToast) showToast('Gagal memuat beberapa data. Periksa koneksi.', 'error');
            } finally {
                if (alive) setLoading(false);
            }
        };

        fetchData();

        return () => {
            alive = false;
            controller.abort();
        };
    }, [session, isInitialized, showToast, getCachedSpots, setCachedSpots]);

    // Retry fetch spots
    const retryFetchSpots = useCallback(async () => {
        try {
            setSpotsError(null);
            const data = await fetchStrategicSpots();
            setStrategicSpots(data);
            setCachedSpots(data);
            logger.info('Retry: Fetched and cached strategic spots', { count: data.length });
        } catch (err) {
            logger.error('Retry spots fetch error', err);
            setSpotsError(err.message || 'Gagal memuat spot');
        }
    }, [setCachedSpots]);

    // Retry get location (for timeout/position unavailable errors)
    const retryLocation = useCallback(async () => {
        setLocationError(null);
        setLocationStatus('prompt');
        try {
            const loc = await getCurrentPosition();
            setUserLocation({ lat: loc.latitude, lng: loc.longitude });
            setLocationStatus('granted');
        } catch (err) {
            setLocationError(err.message);
            if (err.code === 'PERMISSION_DENIED') {
                setLocationStatus('denied');
            } else if (err.code === 'NOT_SUPPORTED') {
                setLocationStatus('unsupported');
            } else {
                setLocationStatus('error');
            }
        }
    }, []);

    // Improved Geolocation with location service
    useEffect(() => {
        // Check permission first
        checkLocationPermission().then(status => {
            setLocationStatus(status);
        });

        const stopWatching = watchLocation({
            onUpdate: (loc) => {
                setUserLocation({ lat: loc.latitude, lng: loc.longitude });
                setLocationStatus('granted');
                setLocationError(null);
            },
            onError: (err) => {
                console.warn('Location error:', err.message);
                setLocationError(err.message);
                if (err.code === 'PERMISSION_DENIED') {
                    setLocationStatus('denied');
                } else if (err.code === 'NOT_SUPPORTED') {
                    setLocationStatus('unsupported');
                } else {
                    setLocationStatus('error');
                }
            },
            throttleMs: 4000, // Only update every 4 seconds
        });

        return stopWatching;
    }, []);

    // Helpers
    const parseDate = (v) => { const p = parseISO(v); return isValid(p) ? p : null; };
    const getNetProfit = (o) => parseFloat(o.net_profit) || parseFloat(o.price) || 0;
    const getGrossPrice = (o) => parseFloat(o.gross_price) || parseFloat(o.price) || 0;
    const formatRp = (v) => new Intl.NumberFormat('id-ID').format(Math.round(v));
    
    // Use the centralized haversine function
    const calcDistance = (lat1, lon1, lat2, lon2) => {
        return haversineDistance(lat1, lon1, lat2, lon2);
    };

    // Hot Spots Logic
    const hotSpots = useMemo(() => {
        if (!strategicSpots.length) return { active: [], upcoming: [], hour: new Date().getHours() };
        
        const now = new Date();
        const hour = now.getHours();
        const isWeekend = [0, 6].includes(now.getDay());

        const enrich = (spot) => {
            // Safety checks
            if (!spot.start_hour || !spot.end_hour) return null;

            const start = parseInt(spot.start_hour, 10);
            const end = parseInt(spot.end_hour, 10);
            
            if (isNaN(start) || isNaN(end)) return null;

            const hoursRemaining = end - hour;
            const distance = userLocation && spot.latitude && spot.longitude
                ? calcDistance(userLocation.lat, userLocation.lng, parseFloat(spot.latitude), parseFloat(spot.longitude))
                : null;
            
            const score = (distance !== null ? Math.max(0, 10 - distance) : 5) + Math.min(hoursRemaining * 2, 10);
            return { ...spot, distance, hoursRemaining, score, timeWindow: `${start}:00-${end}:00` };
        };

        const active = strategicSpots
            .filter(s => {
                if (!s.start_hour || !s.end_hour) return false;
                if (s.is_weekend_only && !isWeekend) return false;
                const start = parseInt(s.start_hour, 10);
                const end = parseInt(s.end_hour, 10);
                if (isNaN(start) || isNaN(end)) return false;
                return hour >= start && hour < end;
            })
            .map(enrich)
            .filter(Boolean) // Remove nulls from failures
            .sort((a, b) => b.score - a.score);

        const upcoming = strategicSpots
            .filter(s => {
                if (!s.start_hour || !s.end_hour) return false;
                if (s.is_weekend_only && !isWeekend) return false;
                const start = parseInt(s.start_hour, 10);
                if (isNaN(start)) return false;
                const diff = start - hour;
                return diff > 0 && diff <= 3;
            })
            .map(enrich)
            .filter(Boolean)
            .sort((a, b) => parseInt(a.start_hour, 10) - parseInt(b.start_hour, 10));

        return { active: active.slice(0, 4), upcoming: upcoming.slice(0, 2), hour, isWeekend };
    }, [strategicSpots, userLocation]);

    // Analytics
    const stats = useMemo(() => {
        if (!orders.length) return null;
        
        const today = new Date();
        const totalIncome = orders.reduce((s, o) => s + getNetProfit(o), 0);
        const totalGross = orders.reduce((s, o) => s + getGrossPrice(o), 0);
        const totalExpense = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
        
        // Active days
        const uniqueDays = new Set(orders.map(o => {
            const d = parseDate(o.created_at);
            return d ? format(d, 'yyyy-MM-dd') : null;
        }).filter(Boolean));
        const activeDays = uniqueDays.size || 1;
        
        // Averages
        const avgPerDay = totalIncome / activeDays;
        const avgPerOrder = totalIncome / orders.length;
        const efficiency = totalGross > 0 ? (totalIncome / totalGross) * 100 : 0;
        
        // Trend (last 7 vs prev 7)
        const last7 = orders.filter(o => { const d = parseDate(o.created_at); return d && differenceInDays(today, d) < 7; });
        const prev7 = orders.filter(o => { const d = parseDate(o.created_at); const diff = differenceInDays(today, d); return d && diff >= 7 && diff < 14; });
        const last7Inc = last7.reduce((s, o) => s + getNetProfit(o), 0);
        const prev7Inc = prev7.reduce((s, o) => s + getNetProfit(o), 0);
        const trend = prev7Inc > 0 ? ((last7Inc - prev7Inc) / prev7Inc) * 100 : 0;

        // Streak
        let streak = 0;
        for (let i = 0; i < 30; i++) {
            const check = subDays(today, i);
            const has = orders.some(o => { const d = parseDate(o.created_at); return d && isSameDay(d, check); });
            if (has) streak++; else if (i > 0) break;
        }

        // Best hours
        const hourly = Array(24).fill(null).map((_, h) => ({ hour: h, count: 0, income: 0 }));
        orders.forEach(o => {
            const d = parseDate(o.created_at);
            if (d) { hourly[getHours(d)].count++; hourly[getHours(d)].income += getNetProfit(o); }
        });
        const bestHours = hourly.filter(h => h.count >= 2).sort((a, b) => (b.income/b.count) - (a.income/a.count)).slice(0, 3);

        // Best days
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const daily = Array(7).fill(null).map((_, d) => ({ day: d, name: dayNames[d], count: 0, income: 0 }));
        orders.forEach(o => {
            const d = parseDate(o.created_at);
            if (d) { daily[getDay(d)].count++; daily[getDay(d)].income += getNetProfit(o); }
        });
        const bestDays = daily.filter(d => d.count >= 2).sort((a, b) => (b.income/b.count) - (a.income/a.count)).slice(0, 3);

        return {
            totalOrders: orders.length,
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense,
            avgPerDay,
            avgPerOrder,
            efficiency,
            trend,
            streak,
            activeDays,
            bestHours,
            bestDays
        };
    }, [orders, expenses]);

    // Navigation handler
    const openMaps = (spot) => {
        if (spot.latitude && spot.longitude) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`, '_blank');
        }
    };

    // Loading
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-ui-primary border-t-transparent" />
            </div>
        );
    }

    // Empty state
    if (!orders.length && !strategicSpots.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-6 text-center">
                <BarChart2 className="w-12 h-12 text-ui-muted mb-3" />
                <h2 className="text-lg font-bold text-ui-text">Belum Ada Data</h2>
                <p className="text-sm text-ui-muted mt-1">Catat order untuk melihat insight</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-ui-background">
            {/* Tab Navigation */}
            <div className="sticky top-0 z-10 bg-ui-background px-4 pt-4 pb-2">
                <div className="flex gap-1.5 p-1 bg-ui-surface rounded-ui-xl shadow-ui-sm">
                    <TabButton 
                        active={activeTab === 'now'} 
                        onClick={() => setActiveTab('now')}
                        icon={Flame}
                    >
                        Sekarang
                    </TabButton>
                    <TabButton 
                        active={activeTab === 'spots'} 
                        onClick={() => setActiveTab('spots')}
                        icon={MapPin}
                    >
                        Spot
                    </TabButton>
                    <TabButton 
                        active={activeTab === 'stats'} 
                        onClick={() => setActiveTab('stats')}
                        icon={BarChart2}
                    >
                        Statistik
                    </TabButton>
                </div>
            </div>

            <div className="flex-1 px-4 pb-6 overflow-y-auto">
                {/* Location Status Banner */}
                {locationStatus === 'denied' && (
                    <div className="mb-3 p-3 bg-ui-warning/10 border border-ui-warning/30 rounded-ui-lg flex items-center gap-2">
                        <AlertTriangle size={16} className="text-ui-warning shrink-0" />
                        <p className="text-xs text-ui-warning flex-1">
                            Izin lokasi ditolak. Aktifkan di pengaturan browser/HP untuk fitur jarak.
                        </p>
                    </div>
                )}
                
                {locationStatus === 'unsupported' && (
                    <div className="mb-3 p-3 bg-ui-muted/10 border border-ui-border rounded-ui-lg flex items-center gap-2">
                        <MapPin size={16} className="text-ui-muted shrink-0" />
                        <p className="text-xs text-ui-muted flex-1">
                            Geolocation tidak didukung di perangkat ini.
                        </p>
                    </div>
                )}

                {locationStatus === 'error' && locationError && (
                    <div className="mb-3 p-3 bg-ui-danger/10 border border-ui-danger/30 rounded-ui-lg flex items-center gap-2">
                        <AlertTriangle size={16} className="text-ui-danger shrink-0" />
                        <p className="text-xs text-ui-danger flex-1">{locationError}</p>
                        <button
                            onClick={retryLocation}
                            className="text-xs text-ui-danger font-medium flex items-center gap-1 shrink-0"
                        >
                            <RefreshCw size={12} />
                            Coba lagi
                        </button>
                    </div>
                )}

                {/* Spots Fetch Error Banner */}
                {spotsError && (
                    <div className="mb-3 p-3 bg-ui-danger/10 border border-ui-danger/30 rounded-ui-lg flex items-center gap-2">
                        <AlertTriangle size={16} className="text-ui-danger shrink-0" />
                        <p className="text-xs text-ui-danger flex-1">{spotsError}</p>
                        <button
                            onClick={retryFetchSpots}
                            className="text-xs text-ui-danger font-medium flex items-center gap-1 shrink-0"
                        >
                            <RefreshCw size={12} />
                            Coba lagi
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* ==================== TAB: SEKARANG ==================== */}
                    {activeTab === 'now' && (
                        <motion.div
                            key="now"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4 pt-2"
                        >
                            {/* Hero: Top Hot Spot */}
                            {hotSpots.active.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm font-bold text-ui-text flex items-center gap-2">
                                            <Flame size={16} className="text-ui-danger" />
                                            Spot Ramai Sekarang
                                        </h2>
                                        <span className="text-[10px] text-ui-muted">
                                            Jam {hotSpots.hour}:00
                                        </span>
                                    </div>
                                    
                                    {hotSpots.active.slice(0, 2).map((spot, idx) => (
                                        <SpotCard 
                                            key={spot.id} 
                                            spot={spot} 
                                            isTop={idx === 0}
                                            onNavigate={() => openMaps(spot)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Card className="p-6 text-center">
                                    <Coffee size={32} className="text-ui-muted mx-auto mb-2" />
                                    <h3 className="font-bold text-ui-text">Mode Santai</h3>
                                    <p className="text-xs text-ui-muted mt-1">
                                        Tidak ada spot ramai jam {hotSpots.hour}:00
                                        {hotSpots.upcoming.length > 0 && (
                                            <span className="block mt-1 text-ui-warning">
                                                Spot berikutnya jam {hotSpots.upcoming[0].start_hour}:00
                                            </span>
                                        )}
                                    </p>
                                </Card>
                            )}

                            {/* Upcoming */}
                            {hotSpots.upcoming.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-medium text-ui-muted mb-2 flex items-center gap-1">
                                        <Clock size={12} />
                                        Akan Ramai
                                    </h3>
                                    <div className="space-y-2">
                                        {hotSpots.upcoming.map(spot => (
                                            <button
                                                key={spot.id}
                                                onClick={() => openMaps(spot)}
                                                className="w-full flex items-center gap-3 p-3 bg-ui-surface-muted rounded-ui-lg text-left"
                                            >
                                                <div className="w-10 h-10 rounded-ui-md bg-ui-warning/10 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-ui-warning">
                                                        {spot.start_hour}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-ui-text truncate">{spot.name}</p>
                                                    <p className="text-[10px] text-ui-muted">
                                                        {parseInt(spot.start_hour, 10) - hotSpots.hour} jam lagi
                                                    </p>
                                                </div>
                                                <Navigation size={16} className="text-ui-muted shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick Stats */}
                            {stats && (
                                <div>
                                    <h3 className="text-xs font-medium text-ui-muted mb-2">Performa Anda</h3>
                                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                                        <StatPill 
                                            label="Streak" 
                                            value={`${stats.streak}d`} 
                                            color={stats.streak >= 3 ? 'text-ui-success' : 'text-ui-text'}
                                        />
                                        <StatPill 
                                            label="Rata-rata" 
                                            value={`${(stats.avgPerDay/1000).toFixed(0)}k`}
                                            trend={stats.trend}
                                        />
                                        <StatPill 
                                            label="Efisiensi" 
                                            value={`${stats.efficiency.toFixed(0)}%`}
                                            color={stats.efficiency >= 85 ? 'text-ui-success' : 'text-ui-text'}
                                        />
                                        <StatPill 
                                            label="Order" 
                                            value={stats.totalOrders}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ==================== TAB: SPOT ==================== */}
                    {activeTab === 'spots' && (
                        <motion.div
                            key="spots"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3 pt-2"
                        >
                            <p className="text-xs text-ui-muted">
                                {strategicSpots.length} lokasi strategis di Bandung
                            </p>
                            
                            {/* Group by status */}
                            {hotSpots.active.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-medium text-ui-danger mb-2 flex items-center gap-1">
                                        <Flame size={12} />
                                        Ramai Sekarang ({hotSpots.active.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {hotSpots.active.map((spot, idx) => (
                                            <SpotCard 
                                                key={spot.id} 
                                                spot={spot} 
                                                isTop={idx === 0}
                                                onNavigate={() => openMaps(spot)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Spots Grid */}
                            <div>
                                <h3 className="text-xs font-medium text-ui-muted mb-2">Semua Lokasi</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {[...new Map(strategicSpots.map(s => [s.name, s])).values()].map(spot => {
                                        const isActive = hotSpots.active.some(a => a.name === spot.name);
                                        return (
                                            <button
                                                key={spot.name}
                                                onClick={() => openMaps(spot)}
                                                className={`p-3 rounded-ui-lg text-left transition-all ${
                                                    isActive 
                                                        ? 'bg-ui-success/10 border border-ui-success/30' 
                                                        : 'bg-ui-surface-muted border border-transparent hover:border-ui-border'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1 mb-1">
                                                    <MapPin size={12} className={isActive ? 'text-ui-success' : 'text-ui-muted'} />
                                                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-ui-success animate-pulse" />}
                                                </div>
                                                <p className="text-xs font-medium text-ui-text truncate">{spot.name}</p>
                                                <p className="text-[9px] text-ui-muted truncate capitalize">
                                                    {spot.category?.replace(/[/-]/g, ' ')}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ==================== TAB: STATISTIK ==================== */}
                    {activeTab === 'stats' && stats && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4 pt-2"
                        >
                            {/* Summary Card */}
                            <Card className="p-4">
                                <div className="text-center mb-4">
                                    <p className="text-[10px] text-ui-muted uppercase tracking-wide">Profit 30 Hari</p>
                                    <p className={`text-3xl font-bold ${stats.netProfit >= 0 ? 'text-ui-success' : 'text-ui-danger'}`}>
                                        Rp {formatRp(stats.netProfit)}
                                    </p>
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                        {stats.trend > 0 ? (
                                            <TrendingUp size={14} className="text-ui-success" />
                                        ) : stats.trend < 0 ? (
                                            <TrendingDown size={14} className="text-ui-danger" />
                                        ) : null}
                                        <span className={`text-xs ${stats.trend >= 0 ? 'text-ui-success' : 'text-ui-danger'}`}>
                                            {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}% vs minggu lalu
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-ui-border">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-ui-text">{stats.totalOrders}</p>
                                        <p className="text-[10px] text-ui-muted">Order</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-ui-success">Rp {formatRp(stats.totalIncome)}</p>
                                        <p className="text-[10px] text-ui-muted">Pendapatan</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-ui-danger">Rp {formatRp(stats.totalExpense)}</p>
                                        <p className="text-[10px] text-ui-muted">Pengeluaran</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Best Time - Collapsible */}
                            <div className="space-y-2">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'time' ? null : 'time')}
                                    className="w-full flex items-center justify-between p-3 bg-ui-surface-muted rounded-ui-lg"
                                >
                                    <span className="text-sm font-medium text-ui-text flex items-center gap-2">
                                        <Clock size={16} className="text-ui-primary" />
                                        Waktu Terbaik
                                    </span>
                                    {expandedSection === 'time' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                                
                                <AnimatePresence>
                                    {expandedSection === 'time' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-3 bg-ui-surface rounded-ui-lg space-y-3">
                                                {stats.bestHours.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] text-ui-muted mb-2">JAM PRODUKTIF</p>
                                                        <div className="flex gap-2">
                                                            {stats.bestHours.map((h, idx) => (
                                                                <div 
                                                                    key={h.hour} 
                                                                    className={`flex-1 p-2 rounded-ui-md text-center ${
                                                                        idx === 0 ? 'bg-ui-primary/20' : 'bg-ui-surface-muted'
                                                                    }`}
                                                                >
                                                                    <p className={`text-lg font-bold ${idx === 0 ? 'text-ui-primary' : 'text-ui-text'}`}>
                                                                        {h.hour}:00
                                                                    </p>
                                                                    <p className="text-[9px] text-ui-muted">
                                                                        {formatRp(h.income / h.count)}/order
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {stats.bestDays.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] text-ui-muted mb-2">HARI TERBAIK</p>
                                                        <div className="flex gap-2">
                                                            {stats.bestDays.map((d, idx) => (
                                                                <div 
                                                                    key={d.day} 
                                                                    className={`flex-1 p-2 rounded-ui-md text-center ${
                                                                        idx === 0 ? 'bg-ui-success/20' : 'bg-ui-surface-muted'
                                                                    }`}
                                                                >
                                                                    <p className={`text-sm font-bold ${idx === 0 ? 'text-ui-success' : 'text-ui-text'}`}>
                                                                        {d.name}
                                                                    </p>
                                                                    <p className="text-[9px] text-ui-muted">
                                                                        {formatRp(d.income / d.count)}/order
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Performance Metrics - Collapsible */}
                            <div className="space-y-2">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'perf' ? null : 'perf')}
                                    className="w-full flex items-center justify-between p-3 bg-ui-surface-muted rounded-ui-lg"
                                >
                                    <span className="text-sm font-medium text-ui-text flex items-center gap-2">
                                        <Target size={16} className="text-ui-success" />
                                        Performa
                                    </span>
                                    {expandedSection === 'perf' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                                
                                <AnimatePresence>
                                    {expandedSection === 'perf' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-3 bg-ui-surface rounded-ui-lg space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-ui-muted">Rata-rata/Hari</span>
                                                    <span className="text-sm font-bold text-ui-text">Rp {formatRp(stats.avgPerDay)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-ui-muted">Rata-rata/Order</span>
                                                    <span className="text-sm font-bold text-ui-text">Rp {formatRp(stats.avgPerOrder)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-ui-muted">Efisiensi</span>
                                                    <span className={`text-sm font-bold ${stats.efficiency >= 85 ? 'text-ui-success' : 'text-ui-text'}`}>
                                                        {stats.efficiency.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-ui-muted">Hari Aktif</span>
                                                    <span className="text-sm font-bold text-ui-text">{stats.activeDays} hari</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-ui-muted">Streak</span>
                                                    <span className="text-sm font-bold text-ui-warning">{stats.streak} hari</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Prediction */}
                            <Card className="p-4">
                                <p className="text-[10px] text-ui-muted uppercase tracking-wide mb-3">Prediksi Pendapatan</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center p-2 bg-ui-surface-muted rounded-ui-md">
                                        <p className="text-xs text-ui-muted">Harian</p>
                                        <p className="text-sm font-bold text-ui-text">Rp {formatRp(stats.avgPerDay)}</p>
                                    </div>
                                    <div className="text-center p-2 bg-ui-primary/10 rounded-ui-md border border-ui-primary/30">
                                        <p className="text-xs text-ui-primary">Mingguan</p>
                                        <p className="text-sm font-bold text-ui-text">Rp {formatRp(stats.avgPerDay * 7)}</p>
                                    </div>
                                    <div className="text-center p-2 bg-ui-surface-muted rounded-ui-md">
                                        <p className="text-xs text-ui-muted">Bulanan</p>
                                        <p className="text-sm font-bold text-ui-text">Rp {formatRp(stats.avgPerDay * 30)}</p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Stats tab with no data */}
                    {activeTab === 'stats' && !stats && (
                        <motion.div
                            key="stats-empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-[40vh] text-center"
                        >
                            <BarChart2 className="w-12 h-12 text-ui-muted mb-3" />
                            <p className="text-sm text-ui-muted">Belum ada data statistik</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
