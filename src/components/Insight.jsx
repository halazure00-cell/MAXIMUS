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
    Award,
    AlertTriangle,
    ChevronRight,
    Flame,
    Coffee,
    Sun,
    Moon,
    Sunrise,
    Sunset,
    Calendar,
    DollarSign,
    Activity,
    BarChart3,
    Lightbulb,
    Star,
    MapPin,
    Navigation,
    Building2,
    Train,
    Plane,
    GraduationCap,
    Utensils,
    TreePine,
    ShoppingBag,
    Users,
    Timer,
    CircleDot,
    ExternalLink
} from 'lucide-react';
import {
    format,
    parseISO,
    isValid,
    getHours,
    getDay,
    subDays,
    startOfMonth,
    endOfMonth,
    differenceInDays,
    isSameDay,
    startOfDay,
    endOfDay
} from 'date-fns';
import { id } from 'date-fns/locale';
import Card from './Card';
import SectionTitle from './SectionTitle';

/**
 * Insight Component - Smart Analytics & Recommendations for Ojol Drivers
 * 
 * Features:
 * 1. Performance Score - Overall rating berdasarkan efisiensi, konsistensi, dan produktivitas
 * 2. Best Time Analysis - Analisis jam dan hari terbaik untuk bekerja
 * 3. Hot Spots Bandung - Rekomendasi lokasi strategis berdasarkan waktu & hari
 * 4. Earning Predictions - Prediksi pendapatan berdasarkan pola historis
 * 5. Smart Recommendations - Tips personalisasi berdasarkan data pengguna
 * 6. Streak & Achievement - Gamifikasi untuk motivasi
 */

export default function Insight({ showToast }) {
    const { settings, session } = useSettings();
    const [orders, setOrders] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [strategicSpots, setStrategicSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(false);

    // Fetch data dari Supabase
    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // Fetch orders 30 hari terakhir untuk analisis komprehensif
                const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
                
                const [ordersRes, expensesRes, spotsRes] = await Promise.all([
                    supabase
                        .from('orders')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .gte('created_at', thirtyDaysAgo)
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('expenses')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .gte('created_at', thirtyDaysAgo)
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('strategic_spots')
                        .select('*')
                ]);

                if (ordersRes.error) throw ordersRes.error;
                if (expensesRes.error) throw expensesRes.error;
                if (spotsRes.error) console.warn('Strategic spots fetch warning:', spotsRes.error);

                setOrders(ordersRes.data || []);
                setExpenses(expensesRes.data || []);
                setStrategicSpots(spotsRes.data || []);
            } catch (error) {
                console.error('Error fetching insight data:', error);
                if (showToast) {
                    showToast('Gagal memuat data insight', 'error');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session]);

    // Get user location for distance calculation
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError(true);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationError(false);
            },
            (error) => {
                console.warn('Geolocation error:', error);
                setLocationError(true);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    }, []);

    // Helper functions
    const parseDate = (value) => {
        if (!value) return null;
        const parsed = parseISO(value);
        return isValid(parsed) ? parsed : null;
    };

    const getNetProfit = (order) => {
        const storedNet = parseFloat(order.net_profit);
        if (Number.isFinite(storedNet)) return storedNet;
        const fallbackPrice = parseFloat(order.price);
        if (Number.isFinite(fallbackPrice)) return fallbackPrice;
        return 0;
    };

    const getGrossPrice = (order) => {
        const storedGross = parseFloat(order.gross_price);
        if (Number.isFinite(storedGross)) return storedGross;
        return parseFloat(order.price) || 0;
    };

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(Math.round(value));

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Get category icon for spots
    const getCategoryIcon = (category) => {
        const categoryMap = {
            'tourism/government': Building2,
            'transport': Train,
            'public-space': Users,
            'mall/tourism': ShoppingBag,
            'campus': GraduationCap,
            'campus/food': Utensils,
            'gateway': Navigation,
            'food': Utensils,
            'tourism': TreePine
        };
        return categoryMap[category] || MapPin;
    };

    // Get category color
    const getCategoryColor = (category) => {
        const colorMap = {
            'tourism/government': 'text-ui-info',
            'transport': 'text-ui-success',
            'public-space': 'text-ui-warning',
            'mall/tourism': 'text-ui-primary',
            'campus': 'text-purple-500',
            'campus/food': 'text-orange-500',
            'gateway': 'text-ui-danger',
            'food': 'text-orange-500',
            'tourism': 'text-green-500'
        };
        return colorMap[category] || 'text-ui-muted';
    };

    // ============================================================
    // HOT SPOTS ENGINE - Smart Location Recommendations
    // ============================================================

    const hotSpots = useMemo(() => {
        if (strategicSpots.length === 0) {
            return { active: [], upcoming: [], allSpots: [] };
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = Sunday
        const isWeekend = currentDay === 0 || currentDay === 6;

        // Filter active spots (within current time window)
        const activeSpots = strategicSpots.filter(spot => {
            // Check weekend restriction
            if (spot.is_weekend_only && !isWeekend) return false;
            
            // Check time window
            const startHour = parseInt(spot.start_hour, 10);
            const endHour = parseInt(spot.end_hour, 10);
            
            return currentHour >= startHour && currentHour < endHour;
        });

        // Filter upcoming spots (starting in next 3 hours)
        const upcomingSpots = strategicSpots.filter(spot => {
            if (spot.is_weekend_only && !isWeekend) return false;
            
            const startHour = parseInt(spot.start_hour, 10);
            const hourDiff = startHour - currentHour;
            
            // Starting in 1-3 hours, not already active
            return hourDiff > 0 && hourDiff <= 3;
        });

        // Calculate distance and sort by proximity if user location available
        const enrichSpot = (spot) => {
            let distance = null;
            if (userLocation && spot.latitude && spot.longitude) {
                distance = calculateDistance(
                    userLocation.lat, userLocation.lng,
                    parseFloat(spot.latitude), parseFloat(spot.longitude)
                );
            }
            
            // Calculate urgency score
            const startHour = parseInt(spot.start_hour, 10);
            const endHour = parseInt(spot.end_hour, 10);
            const hoursRemaining = endHour - currentHour;
            
            // Priority score: closer spots + more time remaining = higher priority
            const proximityScore = distance ? Math.max(0, 10 - distance) : 5;
            const timeScore = Math.min(hoursRemaining * 2, 10);
            const priorityScore = proximityScore + timeScore;

            return {
                ...spot,
                distance,
                hoursRemaining,
                priorityScore,
                timeWindow: `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`
            };
        };

        const enrichedActive = activeSpots
            .map(enrichSpot)
            .sort((a, b) => b.priorityScore - a.priorityScore);

        const enrichedUpcoming = upcomingSpots
            .map(enrichSpot)
            .sort((a, b) => {
                const aStart = parseInt(a.start_hour, 10);
                const bStart = parseInt(b.start_hour, 10);
                return aStart - bStart;
            });

        // Group spots by unique location for "all spots" view
        const uniqueLocations = [...new Map(
            strategicSpots.map(spot => [spot.name, spot])
        ).values()];

        return {
            active: enrichedActive.slice(0, 5),
            upcoming: enrichedUpcoming.slice(0, 3),
            allSpots: uniqueLocations,
            currentHour,
            isWeekend
        };
    }, [strategicSpots, userLocation]);

    // ============================================================
    // SMART ANALYTICS ENGINE - Algoritma Cerdas
    // ============================================================

    const analytics = useMemo(() => {
        if (orders.length === 0) {
            return {
                performanceScore: 0,
                hourlyStats: [],
                dailyStats: [],
                bestHours: [],
                bestDays: [],
                streak: 0,
                avgOrdersPerDay: 0,
                avgIncomePerOrder: 0,
                avgIncomePerDay: 0,
                totalOrders: 0,
                totalIncome: 0,
                totalExpenses: 0,
                netProfit: 0,
                efficiencyRate: 0,
                consistency: 0,
                recommendations: [],
                prediction: { daily: 0, weekly: 0, monthly: 0 },
                trend: 'neutral',
                trendPercent: 0
            };
        }

        // 1. Kalkulasi Dasar
        const totalOrders = orders.length;
        const totalIncome = orders.reduce((sum, o) => sum + getNetProfit(o), 0);
        const totalGross = orders.reduce((sum, o) => sum + getGrossPrice(o), 0);
        const totalExpensesAmount = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const netProfit = totalIncome - totalExpensesAmount;

        // 2. Analisis Per Jam (0-23)
        const hourlyData = Array(24).fill(null).map((_, hour) => ({
            hour,
            orders: 0,
            income: 0,
            avgIncome: 0
        }));

        orders.forEach(order => {
            const date = parseDate(order.created_at);
            if (date) {
                const hour = getHours(date);
                hourlyData[hour].orders++;
                hourlyData[hour].income += getNetProfit(order);
            }
        });

        hourlyData.forEach(data => {
            data.avgIncome = data.orders > 0 ? data.income / data.orders : 0;
        });

        // 3. Analisis Per Hari (0=Minggu, 1=Senin, dst)
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dailyData = Array(7).fill(null).map((_, day) => ({
            day,
            dayName: dayNames[day],
            orders: 0,
            income: 0,
            avgIncome: 0,
            daysTracked: 0
        }));

        // Track berapa banyak hari yang sudah dilalui untuk setiap hari dalam seminggu
        const trackedDates = new Set();
        orders.forEach(order => {
            const date = parseDate(order.created_at);
            if (date) {
                const dayOfWeek = getDay(date);
                dailyData[dayOfWeek].orders++;
                dailyData[dayOfWeek].income += getNetProfit(order);
                
                const dateKey = format(date, 'yyyy-MM-dd');
                if (!trackedDates.has(`${dayOfWeek}-${dateKey}`)) {
                    trackedDates.add(`${dayOfWeek}-${dateKey}`);
                    dailyData[dayOfWeek].daysTracked++;
                }
            }
        });

        dailyData.forEach(data => {
            data.avgIncome = data.daysTracked > 0 ? data.income / data.daysTracked : 0;
        });

        // 4. Best Hours (Top 3 jam dengan rata-rata income tertinggi, minimal 2 order)
        const bestHours = [...hourlyData]
            .filter(h => h.orders >= 2)
            .sort((a, b) => b.avgIncome - a.avgIncome)
            .slice(0, 3)
            .map(h => ({
                hour: h.hour,
                label: `${h.hour.toString().padStart(2, '0')}:00`,
                avgIncome: h.avgIncome,
                orders: h.orders
            }));

        // 5. Best Days (Top 3 hari dengan rata-rata income tertinggi)
        const bestDays = [...dailyData]
            .filter(d => d.orders >= 3)
            .sort((a, b) => b.avgIncome - a.avgIncome)
            .slice(0, 3);

        // 6. Streak Calculation (berturut-turut hari dengan order)
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 30; i++) {
            const checkDate = subDays(today, i);
            const hasOrder = orders.some(o => {
                const orderDate = parseDate(o.created_at);
                return orderDate && isSameDay(orderDate, checkDate);
            });
            if (hasOrder) {
                streak++;
            } else if (i > 0) { // Skip hari ini jika belum ada order
                break;
            }
        }

        // 7. Active Days & Averages
        const uniqueDays = new Set(
            orders.map(o => {
                const date = parseDate(o.created_at);
                return date ? format(date, 'yyyy-MM-dd') : null;
            }).filter(Boolean)
        );
        const activeDays = uniqueDays.size;
        const avgOrdersPerDay = activeDays > 0 ? totalOrders / activeDays : 0;
        const avgIncomePerOrder = totalOrders > 0 ? totalIncome / totalOrders : 0;
        const avgIncomePerDay = activeDays > 0 ? totalIncome / activeDays : 0;

        // 8. Efficiency Rate (Net vs Gross)
        const efficiencyRate = totalGross > 0 ? (totalIncome / totalGross) * 100 : 0;

        // 9. Consistency Score (seberapa konsisten bekerja setiap hari)
        const last14Days = Array.from({ length: 14 }, (_, i) => subDays(today, i));
        const daysWorked = last14Days.filter(day => 
            orders.some(o => {
                const orderDate = parseDate(o.created_at);
                return orderDate && isSameDay(orderDate, day);
            })
        ).length;
        const consistency = (daysWorked / 14) * 100;

        // 10. Trend Analysis (7 hari terakhir vs 7 hari sebelumnya)
        const last7DaysOrders = orders.filter(o => {
            const date = parseDate(o.created_at);
            return date && differenceInDays(today, date) < 7;
        });
        const prev7DaysOrders = orders.filter(o => {
            const date = parseDate(o.created_at);
            const diff = differenceInDays(today, date);
            return date && diff >= 7 && diff < 14;
        });

        const last7Income = last7DaysOrders.reduce((sum, o) => sum + getNetProfit(o), 0);
        const prev7Income = prev7DaysOrders.reduce((sum, o) => sum + getNetProfit(o), 0);

        let trend = 'neutral';
        let trendPercent = 0;
        if (prev7Income > 0) {
            trendPercent = ((last7Income - prev7Income) / prev7Income) * 100;
            trend = trendPercent > 5 ? 'up' : trendPercent < -5 ? 'down' : 'neutral';
        }

        // 11. Performance Score (0-100)
        // Weighted: Efficiency (30%), Consistency (25%), Productivity (25%), Growth (20%)
        const productivityScore = Math.min((avgOrdersPerDay / 10) * 100, 100); // Target 10 order/hari
        const growthScore = Math.min(Math.max(50 + trendPercent, 0), 100);
        
        const performanceScore = Math.round(
            (efficiencyRate * 0.30) +
            (consistency * 0.25) +
            (productivityScore * 0.25) +
            (growthScore * 0.20)
        );

        // 12. Predictions
        const prediction = {
            daily: avgIncomePerDay,
            weekly: avgIncomePerDay * 7,
            monthly: avgIncomePerDay * 30
        };

        // 13. Smart Recommendations
        const recommendations = generateRecommendations({
            bestHours,
            bestDays,
            avgOrdersPerDay,
            efficiencyRate,
            consistency,
            trend,
            trendPercent,
            streak,
            hourlyData,
            dailyData,
            totalExpensesAmount,
            totalIncome
        });

        return {
            performanceScore,
            hourlyStats: hourlyData,
            dailyStats: dailyData,
            bestHours,
            bestDays,
            streak,
            avgOrdersPerDay,
            avgIncomePerOrder,
            avgIncomePerDay,
            totalOrders,
            totalIncome,
            totalExpenses: totalExpensesAmount,
            netProfit,
            efficiencyRate,
            consistency,
            recommendations,
            prediction,
            trend,
            trendPercent,
            activeDays
        };
    }, [orders, expenses]);

    // ============================================================
    // RECOMMENDATION ENGINE - Logika Rekomendasi Cerdas
    // ============================================================

    function generateRecommendations(data) {
        const recommendations = [];
        const currentHour = new Date().getHours();
        const currentDay = getDay(new Date());

        // 1. Rekomendasi Jam Kerja Optimal
        if (data.bestHours.length > 0) {
            const bestHour = data.bestHours[0];
            const isNowBestTime = Math.abs(currentHour - bestHour.hour) <= 1;
            
            if (isNowBestTime) {
                recommendations.push({
                    type: 'urgent',
                    icon: Flame,
                    title: 'Jam Emas Sekarang!',
                    description: `Ini waktu terbaik Anda! Rata-rata Rp ${formatCurrency(bestHour.avgIncome)}/order pada jam ini.`,
                    action: 'Maksimalkan order sekarang'
                });
            } else {
                const nextBestHour = data.bestHours.find(h => h.hour > currentHour) || data.bestHours[0];
                recommendations.push({
                    type: 'info',
                    icon: Clock,
                    title: 'Jam Terbaik Anda',
                    description: `Performa terbaik di jam ${nextBestHour.label}. Rata-rata Rp ${formatCurrency(nextBestHour.avgIncome)}/order.`,
                    action: 'Siapkan diri untuk jam tersebut'
                });
            }
        }

        // 2. Rekomendasi Hari Kerja
        if (data.bestDays.length > 0) {
            const todayIsBest = data.bestDays.some(d => d.day === currentDay);
            if (todayIsBest) {
                const todayData = data.bestDays.find(d => d.day === currentDay);
                recommendations.push({
                    type: 'success',
                    icon: Star,
                    title: 'Hari Produktif!',
                    description: `Hari ini biasanya hari terbaik Anda dengan rata-rata Rp ${formatCurrency(todayData.avgIncome)}/hari.`,
                    action: 'Kerja lebih lama hari ini'
                });
            }
        }

        // 3. Rekomendasi Efisiensi
        if (data.efficiencyRate < 80) {
            recommendations.push({
                type: 'warning',
                icon: AlertTriangle,
                title: 'Efisiensi Bisa Ditingkatkan',
                description: `Efisiensi Anda ${data.efficiencyRate.toFixed(1)}%. Pertimbangkan order prioritas untuk potongan lebih kecil.`,
                action: 'Aktifkan mode Prioritas'
            });
        } else if (data.efficiencyRate >= 85) {
            recommendations.push({
                type: 'success',
                icon: Award,
                title: 'Efisiensi Excellent!',
                description: `Efisiensi ${data.efficiencyRate.toFixed(1)}% sangat bagus! Pertahankan strategi ini.`,
                action: null
            });
        }

        // 4. Rekomendasi Konsistensi
        if (data.consistency < 50) {
            recommendations.push({
                type: 'warning',
                icon: Calendar,
                title: 'Tingkatkan Konsistensi',
                description: 'Anda hanya aktif di kurang dari separuh hari. Konsistensi = pendapatan stabil.',
                action: 'Buat jadwal harian'
            });
        }

        // 5. Rekomendasi berdasarkan Trend
        if (data.trend === 'down') {
            recommendations.push({
                type: 'warning',
                icon: TrendingDown,
                title: 'Pendapatan Menurun',
                description: `Turun ${Math.abs(data.trendPercent).toFixed(1)}% dibanding minggu lalu. Coba jam alternatif.`,
                action: 'Eksplorasi waktu baru'
            });
        } else if (data.trend === 'up') {
            recommendations.push({
                type: 'success',
                icon: TrendingUp,
                title: 'Trend Positif!',
                description: `Naik ${data.trendPercent.toFixed(1)}% dari minggu lalu. Strategi Anda berhasil!`,
                action: null
            });
        }

        // 6. Rekomendasi Expense Management
        const expenseRatio = data.totalIncome > 0 ? (data.totalExpensesAmount / data.totalIncome) * 100 : 0;
        if (expenseRatio > 30) {
            recommendations.push({
                type: 'warning',
                icon: DollarSign,
                title: 'Pengeluaran Tinggi',
                description: `Pengeluaran ${expenseRatio.toFixed(1)}% dari pendapatan. Cek pengeluaran bensin dan makan.`,
                action: 'Review pengeluaran di Riwayat'
            });
        }

        // 7. Streak Motivation
        if (data.streak >= 7) {
            recommendations.push({
                type: 'success',
                icon: Flame,
                title: `${data.streak} Hari Beruntun!`,
                description: 'Konsistensi luar biasa! Pertahankan momentum ini.',
                action: null
            });
        } else if (data.streak === 0) {
            recommendations.push({
                type: 'info',
                icon: Zap,
                title: 'Mulai Streak Baru',
                description: 'Ambil order hari ini untuk memulai streak produktivitas.',
                action: 'Mulai order pertama'
            });
        }

        // 8. Rekomendasi Jam Sepi
        const lowHours = data.hourlyData
            .filter(h => h.orders > 0 && h.orders < 3)
            .sort((a, b) => a.orders - b.orders)
            .slice(0, 2);
        
        if (lowHours.length > 0 && data.avgOrdersPerDay > 5) {
            recommendations.push({
                type: 'info',
                icon: Coffee,
                title: 'Optimalkan Waktu Istirahat',
                description: `Jam ${lowHours.map(h => h.hour).join(' & ')} biasanya sepi. Gunakan untuk istirahat.`,
                action: 'Atur jadwal istirahat'
            });
        }

        // 9. Rekomendasi Hot Spot (berdasarkan strategicSpots state)
        // This will be handled separately in the component with hotSpots data

        return recommendations.slice(0, 6); // Max 6 recommendations
    }

    // Generate spot-based recommendations
    const spotRecommendations = useMemo(() => {
        const recs = [];
        const currentHour = new Date().getHours();

        if (hotSpots.active.length > 0) {
            const topSpot = hotSpots.active[0];
            recs.push({
                type: 'urgent',
                icon: MapPin,
                title: `🔥 ${topSpot.name} Ramai!`,
                description: `Spot paling potensial saat ini. ${topSpot.notes || 'Segera menuju lokasi.'}`,
                action: topSpot.distance !== null 
                    ? `${topSpot.distance.toFixed(1)} km dari sini` 
                    : 'Buka di Maps'
            });
        }

        if (hotSpots.upcoming.length > 0 && hotSpots.active.length < 2) {
            const nextSpot = hotSpots.upcoming[0];
            const startHour = parseInt(nextSpot.start_hour, 10);
            recs.push({
                type: 'info',
                icon: Navigation,
                title: `Bersiap ke ${nextSpot.name}`,
                description: `Akan ramai jam ${startHour}:00. Posisikan diri lebih awal untuk dapat order pertama.`,
                action: `${startHour - currentHour} jam lagi`
            });
        }

        // Weekend tip
        const isWeekend = [0, 6].includes(new Date().getDay());
        if (isWeekend && strategicSpots.some(s => s.is_weekend_only)) {
            const weekendSpots = strategicSpots.filter(s => s.is_weekend_only);
            if (weekendSpots.length > 0) {
                recs.push({
                    type: 'success',
                    icon: Star,
                    title: 'Weekend Bonus!',
                    description: `Ada ${weekendSpots.length} spot khusus weekend: ${weekendSpots.slice(0, 2).map(s => s.name).join(', ')}.`,
                    action: 'Maksimalkan weekend'
                });
            }
        }

        return recs;
    }, [hotSpots, strategicSpots]);

    // ============================================================
    // UI COMPONENTS
    // ============================================================

    const getTimeIcon = (hour) => {
        if (hour >= 5 && hour < 10) return Sunrise;
        if (hour >= 10 && hour < 16) return Sun;
        if (hour >= 16 && hour < 19) return Sunset;
        return Moon;
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-ui-success';
        if (score >= 60) return 'text-ui-primary';
        if (score >= 40) return 'text-ui-warning';
        return 'text-ui-danger';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Perlu Ditingkatkan';
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'urgent':
                return 'bg-ui-danger/10 border-ui-danger/30 text-ui-danger';
            case 'warning':
                return 'bg-ui-warning/10 border-ui-warning/30 text-ui-warning';
            case 'success':
                return 'bg-ui-success/10 border-ui-success/30 text-ui-success';
            default:
                return 'bg-ui-info/10 border-ui-info/30 text-ui-info';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-ui-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-primary mx-auto mb-4"></div>
                    <p className="text-ui-muted text-sm">Menganalisis data Anda...</p>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-ui-background p-6">
                <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-ui-muted mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-ui-text mb-2">Belum Ada Data</h2>
                    <p className="text-ui-muted text-sm mb-6">
                        Mulai catat order di halaman Hitung untuk melihat insight dan rekomendasi cerdas.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-ui-background p-4 space-y-4 pb-8">
            {/* Header - Performance Score */}
            <Card className="p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-ui-primary/5 to-transparent" />
                <div className="relative">
                    <SectionTitle>Skor Performa</SectionTitle>
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        className={`text-6xl font-bold mt-2 ${getScoreColor(analytics.performanceScore)}`}
                    >
                        {analytics.performanceScore}
                    </motion.div>
                    <p className={`text-sm font-medium mt-1 ${getScoreColor(analytics.performanceScore)}`}>
                        {getScoreLabel(analytics.performanceScore)}
                    </p>
                    
                    {/* Trend Badge */}
                    <div className="flex items-center justify-center gap-1 mt-3">
                        {analytics.trend === 'up' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-ui-success bg-ui-success/10 px-2 py-1 rounded-full">
                                <TrendingUp size={12} />
                                +{analytics.trendPercent.toFixed(1)}% vs minggu lalu
                            </span>
                        ) : analytics.trend === 'down' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-ui-danger bg-ui-danger/10 px-2 py-1 rounded-full">
                                <TrendingDown size={12} />
                                {analytics.trendPercent.toFixed(1)}% vs minggu lalu
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-ui-muted bg-ui-surface-muted px-2 py-1 rounded-full">
                                <Activity size={12} />
                                Stabil
                            </span>
                        )}
                    </div>
                </div>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Target size={14} className="text-ui-primary" />
                        <SectionTitle className="text-[9px]">Rata-rata/Hari</SectionTitle>
                    </div>
                    <div className="text-lg font-bold text-ui-text">
                        Rp {formatCurrency(analytics.avgIncomePerDay)}
                    </div>
                    <p className="text-[10px] text-ui-muted">{analytics.avgOrdersPerDay.toFixed(1)} order/hari</p>
                </Card>
                
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Flame size={14} className="text-ui-warning" />
                        <SectionTitle className="text-[9px]">Streak</SectionTitle>
                    </div>
                    <div className="text-lg font-bold text-ui-text">
                        {analytics.streak} Hari
                    </div>
                    <p className="text-[10px] text-ui-muted">Berturut-turut aktif</p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap size={14} className="text-ui-success" />
                        <SectionTitle className="text-[9px]">Efisiensi</SectionTitle>
                    </div>
                    <div className="text-lg font-bold text-ui-text">
                        {analytics.efficiencyRate.toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-ui-muted">Net vs Gross</p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar size={14} className="text-ui-info" />
                        <SectionTitle className="text-[9px]">Konsistensi</SectionTitle>
                    </div>
                    <div className="text-lg font-bold text-ui-text">
                        {analytics.consistency.toFixed(0)}%
                    </div>
                    <p className="text-[10px] text-ui-muted">14 hari terakhir</p>
                </Card>
            </div>

            {/* ============================================================ */}
            {/* HOT SPOTS BANDUNG - Smart Location Recommendations */}
            {/* ============================================================ */}
            
            {/* Active Hot Spots - Currently Prime Time */}
            {hotSpots.active.length > 0 && (
                <Card className="p-4 border-2 border-ui-danger/30 bg-gradient-to-br from-ui-danger/5 to-transparent">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-ui-danger/20 rounded-ui-md">
                                <Flame size={16} className="text-ui-danger" />
                            </div>
                            <div>
                                <SectionTitle className="text-ui-danger">Hot Spot Aktif</SectionTitle>
                                <p className="text-[10px] text-ui-muted">Ramai sekarang • Jam {hotSpots.currentHour}:00</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-medium text-ui-danger bg-ui-danger/10 px-2 py-1 rounded-full animate-pulse">
                            LIVE
                        </span>
                    </div>

                    <div className="space-y-3">
                        {hotSpots.active.map((spot, idx) => {
                            const CategoryIcon = getCategoryIcon(spot.category);
                            return (
                                <motion.div
                                    key={`${spot.id}-${idx}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`p-3 rounded-ui-lg border ${
                                        idx === 0 
                                            ? 'bg-ui-danger/10 border-ui-danger/30' 
                                            : 'bg-ui-surface-muted border-ui-border'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-ui-md ${idx === 0 ? 'bg-ui-danger/20' : 'bg-ui-surface'}`}>
                                            <CategoryIcon size={18} className={idx === 0 ? 'text-ui-danger' : getCategoryColor(spot.category)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="text-sm font-bold text-ui-text truncate">{spot.name}</h4>
                                                    <p className="text-[10px] text-ui-muted capitalize">{spot.category?.replace(/[/-]/g, ' ')}</p>
                                                </div>
                                                {idx === 0 && (
                                                    <span className="text-[9px] font-bold text-ui-danger bg-ui-danger/10 px-1.5 py-0.5 rounded shrink-0">
                                                        #1
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex items-center gap-1 text-[10px] text-ui-muted">
                                                    <Clock size={10} />
                                                    <span>{spot.timeWindow}</span>
                                                </div>
                                                {spot.distance !== null && (
                                                    <div className="flex items-center gap-1 text-[10px] text-ui-info">
                                                        <Navigation size={10} />
                                                        <span>{spot.distance.toFixed(1)} km</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1 text-[10px] text-ui-warning">
                                                    <Timer size={10} />
                                                    <span>{spot.hoursRemaining}j lagi</span>
                                                </div>
                                            </div>
                                            
                                            {spot.notes && (
                                                <p className="text-[10px] text-ui-muted mt-2 italic bg-ui-surface/50 px-2 py-1 rounded">
                                                    💡 {spot.notes}
                                                </p>
                                            )}
                                            
                                            {/* Google Maps Link */}
                                            {spot.latitude && spot.longitude && (
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium text-ui-info hover:text-ui-primary transition-colors"
                                                >
                                                    <ExternalLink size={10} />
                                                    Buka di Maps
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Upcoming Hot Spots */}
            {hotSpots.upcoming.length > 0 && (
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-ui-warning/20 rounded-ui-md">
                            <Sunrise size={16} className="text-ui-warning" />
                        </div>
                        <div>
                            <SectionTitle>Spot Akan Ramai</SectionTitle>
                            <p className="text-[10px] text-ui-muted">Siap-siap menuju lokasi</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {hotSpots.upcoming.map((spot, idx) => {
                            const CategoryIcon = getCategoryIcon(spot.category);
                            const startHour = parseInt(spot.start_hour, 10);
                            const hoursUntil = startHour - hotSpots.currentHour;
                            
                            return (
                                <motion.div
                                    key={`upcoming-${spot.id}-${idx}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center gap-3 p-3 bg-ui-surface-muted rounded-ui-lg border border-ui-border"
                                >
                                    <div className="p-2 bg-ui-surface rounded-ui-md">
                                        <CategoryIcon size={16} className={getCategoryColor(spot.category)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-ui-text truncate">{spot.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-ui-warning font-medium">
                                                Mulai jam {startHour}:00
                                            </span>
                                            <span className="text-[10px] text-ui-muted">
                                                ({hoursUntil} jam lagi)
                                            </span>
                                        </div>
                                    </div>
                                    {spot.distance !== null && (
                                        <div className="text-right shrink-0">
                                            <div className="text-xs font-medium text-ui-text">{spot.distance.toFixed(1)} km</div>
                                            <div className="text-[10px] text-ui-muted">dari sini</div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* No Active Spots - Free Mode */}
            {hotSpots.active.length === 0 && strategicSpots.length > 0 && (
                <Card className="p-4 bg-gradient-to-br from-ui-surface-muted to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-ui-surface rounded-ui-lg">
                            <Coffee size={24} className="text-ui-muted" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-ui-text">Mode Santai</h4>
                            <p className="text-xs text-ui-muted mt-0.5">
                                Tidak ada spot yang ramai saat ini (jam {hotSpots.currentHour}:00).
                                {hotSpots.upcoming.length > 0 
                                    ? ` Spot berikutnya jam ${hotSpots.upcoming[0].start_hour}:00.`
                                    : ' Coba area perumahan atau jelajahi sekitar.'}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* All Strategic Spots Overview */}
            {strategicSpots.length > 0 && (
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-ui-info" />
                            <SectionTitle>Spot Strategis Bandung</SectionTitle>
                        </div>
                        <span className="text-[10px] text-ui-muted bg-ui-surface-muted px-2 py-1 rounded-full">
                            {hotSpots.allSpots.length} lokasi
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {hotSpots.allSpots.slice(0, 8).map((spot, idx) => {
                            const CategoryIcon = getCategoryIcon(spot.category);
                            const isActive = hotSpots.active.some(a => a.name === spot.name);
                            
                            return (
                                <motion.a
                                    key={spot.name}
                                    href={`https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`p-3 rounded-ui-lg border transition-all hover:border-ui-primary/50 ${
                                        isActive 
                                            ? 'bg-ui-success/10 border-ui-success/30' 
                                            : 'bg-ui-surface-muted border-ui-border'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <CategoryIcon size={14} className={isActive ? 'text-ui-success' : getCategoryColor(spot.category)} />
                                        {isActive && (
                                            <CircleDot size={8} className="text-ui-success animate-pulse" />
                                        )}
                                    </div>
                                    <h5 className="text-xs font-medium text-ui-text truncate">{spot.name}</h5>
                                    <p className="text-[9px] text-ui-muted capitalize truncate">
                                        {spot.category?.replace(/[/-]/g, ' ')}
                                    </p>
                                </motion.a>
                            );
                        })}
                    </div>
                    
                    <p className="text-[10px] text-ui-muted text-center mt-3">
                        Tap lokasi untuk buka di Google Maps
                    </p>
                </Card>
            )}

            {/* Best Time Section */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Clock size={16} className="text-ui-primary" />
                    <SectionTitle>Waktu Terbaik Anda</SectionTitle>
                </div>

                {analytics.bestHours.length > 0 ? (
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-ui-muted mb-2">Jam Produktif</p>
                            <div className="flex gap-2 flex-wrap">
                                {analytics.bestHours.map((hour, idx) => {
                                    const TimeIcon = getTimeIcon(hour.hour);
                                    return (
                                        <motion.div
                                            key={hour.hour}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-ui-lg ${
                                                idx === 0 
                                                    ? 'bg-ui-primary/20 border border-ui-primary/40' 
                                                    : 'bg-ui-surface-muted border border-ui-border'
                                            }`}
                                        >
                                            <TimeIcon size={16} className={idx === 0 ? 'text-ui-primary' : 'text-ui-muted'} />
                                            <div>
                                                <div className="text-sm font-bold text-ui-text">{hour.label}</div>
                                                <div className="text-[10px] text-ui-muted">
                                                    Rp {formatCurrency(hour.avgIncome)}/order
                                                </div>
                                            </div>
                                            {idx === 0 && (
                                                <span className="text-[9px] font-bold text-ui-primary bg-ui-primary/10 px-1.5 py-0.5 rounded">
                                                    TOP
                                                </span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {analytics.bestDays.length > 0 && (
                            <div className="pt-3 border-t border-ui-border">
                                <p className="text-xs text-ui-muted mb-2">Hari Terbaik</p>
                                <div className="flex gap-2 flex-wrap">
                                    {analytics.bestDays.map((day, idx) => (
                                        <div
                                            key={day.day}
                                            className={`px-3 py-2 rounded-ui-lg ${
                                                idx === 0 
                                                    ? 'bg-ui-success/10 border border-ui-success/30' 
                                                    : 'bg-ui-surface-muted border border-ui-border'
                                            }`}
                                        >
                                            <div className={`text-sm font-bold ${idx === 0 ? 'text-ui-success' : 'text-ui-text'}`}>
                                                {day.dayName}
                                            </div>
                                            <div className="text-[10px] text-ui-muted">
                                                Rp {formatCurrency(day.avgIncome)}/hari
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-ui-muted text-center py-4">
                        Butuh lebih banyak data untuk analisis waktu terbaik
                    </p>
                )}
            </Card>

            {/* Predictions */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Target size={16} className="text-ui-success" />
                    <SectionTitle>Prediksi Pendapatan</SectionTitle>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-ui-surface-muted rounded-ui-lg">
                        <div className="text-[10px] text-ui-muted mb-1">Harian</div>
                        <div className="text-sm font-bold text-ui-text">
                            Rp {formatCurrency(analytics.prediction.daily)}
                        </div>
                    </div>
                    <div className="text-center p-3 bg-ui-primary/10 rounded-ui-lg border border-ui-primary/30">
                        <div className="text-[10px] text-ui-primary mb-1">Mingguan</div>
                        <div className="text-sm font-bold text-ui-text">
                            Rp {formatCurrency(analytics.prediction.weekly)}
                        </div>
                    </div>
                    <div className="text-center p-3 bg-ui-surface-muted rounded-ui-lg">
                        <div className="text-[10px] text-ui-muted mb-1">Bulanan</div>
                        <div className="text-sm font-bold text-ui-text">
                            Rp {formatCurrency(analytics.prediction.monthly)}
                        </div>
                    </div>
                </div>
                
                <p className="text-[10px] text-ui-muted text-center mt-3">
                    *Berdasarkan rata-rata {analytics.activeDays} hari aktif terakhir
                </p>
            </Card>

            {/* Smart Recommendations */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb size={16} className="text-ui-warning" />
                    <SectionTitle>Rekomendasi Cerdas</SectionTitle>
                </div>

                <div className="space-y-3">
                    <AnimatePresence>
                        {/* Spot-based recommendations first */}
                        {spotRecommendations.map((rec, idx) => {
                            const IconComponent = rec.icon;
                            return (
                                <motion.div
                                    key={`spot-${idx}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`p-3 rounded-ui-lg border ${getTypeStyles(rec.type)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-ui-md bg-current/10">
                                            <IconComponent size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-ui-text">{rec.title}</h4>
                                            <p className="text-xs text-ui-muted mt-0.5">{rec.description}</p>
                                            {rec.action && (
                                                <div className="flex items-center gap-1 mt-2 text-[10px] font-medium opacity-80">
                                                    <span>{rec.action}</span>
                                                    <ChevronRight size={12} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                        
                        {/* Performance-based recommendations */}
                        {analytics.recommendations.map((rec, idx) => {
                            const IconComponent = rec.icon;
                            return (
                                <motion.div
                                    key={`perf-${idx}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: (spotRecommendations.length + idx) * 0.1 }}
                                    className={`p-3 rounded-ui-lg border ${getTypeStyles(rec.type)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-ui-md bg-current/10">
                                            <IconComponent size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-ui-text">{rec.title}</h4>
                                            <p className="text-xs text-ui-muted mt-0.5">{rec.description}</p>
                                            {rec.action && (
                                                <div className="flex items-center gap-1 mt-2 text-[10px] font-medium opacity-80">
                                                    <span>{rec.action}</span>
                                                    <ChevronRight size={12} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {analytics.recommendations.length === 0 && spotRecommendations.length === 0 && (
                        <div className="text-center py-6">
                            <Award className="w-12 h-12 text-ui-success mx-auto mb-2" />
                            <p className="text-sm text-ui-text font-medium">Performa Sempurna!</p>
                            <p className="text-xs text-ui-muted">Tidak ada rekomendasi khusus saat ini.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Monthly Summary */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={16} className="text-ui-info" />
                    <SectionTitle>Ringkasan 30 Hari</SectionTitle>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-ui-border">
                        <span className="text-sm text-ui-muted">Total Order</span>
                        <span className="text-sm font-bold text-ui-text">{analytics.totalOrders} order</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-ui-border">
                        <span className="text-sm text-ui-muted">Total Pendapatan</span>
                        <span className="text-sm font-bold text-ui-success">Rp {formatCurrency(analytics.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-ui-border">
                        <span className="text-sm text-ui-muted">Total Pengeluaran</span>
                        <span className="text-sm font-bold text-ui-danger">-Rp {formatCurrency(analytics.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-ui-text">Profit Bersih</span>
                        <span className={`text-lg font-bold ${analytics.netProfit >= 0 ? 'text-ui-success' : 'text-ui-danger'}`}>
                            Rp {formatCurrency(analytics.netProfit)}
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
