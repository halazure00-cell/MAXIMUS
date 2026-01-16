import { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Clock,
    Target,
    Zap,
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
    ExternalLink,
    BarChart2,
    Calendar
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
import { id } from 'date-fns/locale';
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
        };
        return map[category] || MapPin;
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
                        {spot.notes || spot.category?.replace(/[/-]/g, ' ')}
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
    const { settings, session } = useSettings();
    const [orders, setOrders] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [strategicSpots, setStrategicSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('now');
    const [userLocation, setUserLocation] = useState(null);
    const [expandedSection, setExpandedSection] = useState(null);
    const [geoWatchId, setGeoWatchId] = useState(null);

    // Fetch data with robust error handling
    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
                
                // Safe fetch pattern: individual queries with try/catch handled per query or globally but allowing partial success
                const ordersPromise = supabase
                    .from('orders')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .gte('created_at', thirtyDaysAgo)
                    .order('created_at', { ascending: false });
                
                const expensesPromise = supabase
                    .from('expenses')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .gte('created_at', thirtyDaysAgo)
                    .order('created_at', { ascending: false });
                
                const fetchSpots = async () => {
                   // Coba fetch normal dulu (tanpa filter geocode) agar data tetap muncul walau belum digeocode
                   // Supaya user tidak melihat layar kosong saat migrasi database belum jalan sempurna
                    const { data, error } = await supabase
                        .from('strategic_spots')
                        .select('*');
                    
                    return { data, error };
                };

                // Await all and handle results explicitly
                const [ordersRes, expensesRes, spotsRes] = await Promise.all([
                   ordersPromise,
                   expensesPromise,
                   fetchSpots()
                ]);

                // Log specific errors but don't crash whole page
                if (ordersRes.error) console.error('Orders fetch error:', ordersRes.error);
                if (expensesRes.error) console.error('Expenses fetch error:', expensesRes.error);
                if (spotsRes.error) console.error('Spots fetch error:', spotsRes.error);

                setOrders(ordersRes.data || []);
                setExpenses(expensesRes.data || []);
                setStrategicSpots(spotsRes.data || []);

            } catch (error) {
                console.error('Critical Data Fetch Error:', error);
                if (showToast) showToast('Gagal memuat beberapa data. Periksa koneksi.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session, showToast]);

    // Improved Geolocation with cleanup
    useEffect(() => {
        if (!navigator.geolocation) return;

        const id = navigator.geolocation.watchPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn('Geolocation access denied or error:', err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
        
        setGeoWatchId(id);

        return () => {
            if (id) navigator.geolocation.clearWatch(id);
        };
    }, []);

    // Helpers
    const parseDate = (v) => { const p = parseISO(v); return isValid(p) ? p : null; };
    const getNetProfit = (o) => parseFloat(o.net_profit) || parseFloat(o.price) || 0;
    const getGrossPrice = (o) => parseFloat(o.gross_price) || parseFloat(o.price) || 0;
    const formatRp = (v) => new Intl.NumberFormat('id-ID').format(Math.round(v));
    
    const calcDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return null;

        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
