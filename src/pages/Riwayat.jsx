import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useSyncContext } from '../context/SyncContext';
import { 
    getCachedOrders, 
    getCachedExpenses,
} from '../lib/localDb';
import { 
    updateOrder,
    deleteOrder,
    deleteExpense,
} from '../lib/offlineOps';
import { createLogger } from '../lib/logger';
import { toLocalDayKey, getTodayKey } from '../lib/dateUtils';
import {
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    format,
    subDays,
    isSameDay,
    parseISO,
    isValid,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { Plus, Minus, TrendingUp, TrendingDown, Wallet, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import ExpenseModal from '../components/ExpenseModal';
import ConfirmationModal from '../components/ConfirmationModal';
import EditOrderModal from '../components/EditOrderModal';
import FeedbackCard from '../components/FeedbackCard';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import SectionTitle from '../components/SectionTitle';
import SyncStatusBanner from '../components/SyncStatusBanner';

const logger = createLogger('Riwayat');

export default function Riwayat() {
    const { settings, session } = useSettings();
    const { showToast } = useToast();
    const { updateStatus, isInitialized, importInitialData } = useSyncContext();
    const [transactions, setTransactions] = useState([]);
    const [visibleCount, setVisibleCount] = useState(20);
    const [loading, setLoading] = useState(true);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [dailyRecapData, setDailyRecapData] = useState([]);
    const [activeRecap, setActiveRecap] = useState('omzet');
    const [editingOrder, setEditingOrder] = useState(null);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [deleteTargetType, setDeleteTargetType] = useState(null);
    const pageSize = 20;
    
    // Raw data for FeedbackCard
    const [allOrders, setAllOrders] = useState([]);
    const [allExpenses, setAllExpenses] = useState([]);
    
    // Refs untuk tracking operasi async
    const abortControllerRef = useRef(null);
    const isMountedRef = useRef(true);
    const isLoadingRef = useRef(false);
    const lastFetchTimeRef = useRef(0);
    
    // State untuk Rekap Harian (Setoran)
    const [todayRecap, setTodayRecap] = useState({
        income: 0,
        expense: 0,
        net: 0
    });

    const [metrics, setMetrics] = useState({
        grossIncome: 0,
        actualExpenses: 0,
        netCash: 0,
        efficiencyScore: 0,
        appFeeTotal: 0,
        fuelCostTotal: 0,
        maintenanceTotal: 0,
        ordersCount: 0,
        expensesCount: 0
    });

    // Status untuk unified fetch: 'idle' | 'loading' | 'success' | 'error'
    const [fetchStatus, setFetchStatus] = useState('idle');
    const [fetchError, setFetchError] = useState(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Helper: safely update state
    const safeSetState = useCallback((setter, value) => {
        if (isMountedRef.current) {
            setter(value);
        }
    }, []);

    // Main data fetch effect dengan AbortController dan proper error handling
    useEffect(() => {
        if (!session?.user || !isInitialized) {
            safeSetState(setLoading, false);
            return;
        }

        // Prevent duplicate simultaneous fetches
        if (isLoadingRef.current) {
            logger.debug('Fetch already in progress, skipping...');
            return;
        }

        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTimeRef.current;
        if (timeSinceLastFetch < 500) {
            logger.debug('Fetch called too soon, debouncing...');
            return;
        }

        // Create new abort controller for this fetch
        const controller = new AbortController();
        abortControllerRef.current = controller;
        isLoadingRef.current = true;
        lastFetchTimeRef.current = now;

        const loadData = async () => {
            safeSetState(setFetchStatus, 'loading');
            safeSetState(setFetchError, null);
            safeSetState(setLoading, true);

            try {
                // Step 1: Import initial data (dengan guards untuk prevent duplicates)
                logger.debug('Starting import initial data...');
                const importResult = await importInitialData();
                
                if (!isMountedRef.current) {
                    logger.debug('Component unmounted during import, aborting...');
                    return;
                }

                logger.debug('Import result:', importResult);

                // Step 2: Read dari local cache
                logger.debug('Reading from local cache...');
                const orders = await getCachedOrders(session.user.id);
                const expenses = await getCachedExpenses(session.user.id);

                if (!isMountedRef.current) {
                    logger.debug('Component unmounted during data fetch, aborting...');
                    return;
                }

                logger.debug('Data fetched from cache:', {
                    ordersCount: orders.length,
                    expensesCount: expenses.length
                });

                // Step 3: Process data
                processFinancials(orders, expenses);
                safeSetState(setFetchStatus, 'success');

            } catch (error) {
                if (!isMountedRef.current) {
                    logger.debug('Component unmounted during error handling');
                    return;
                }

                // Ignore abort errors
                if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                    logger.debug('Fetch aborted by user');
                    return;
                }

                logger.error('Error loading data', {
                    message: error?.message,
                    stack: error?.stack
                });
                
                safeSetState(setFetchStatus, 'error');
                safeSetState(setFetchError, error?.message || 'Terjadi kesalahan saat memuat data');
                showToast('Gagal memuat data: ' + (error?.message || 'Coba lagi nanti'), 'error');
            } finally {
                if (isMountedRef.current) {
                    safeSetState(setLoading, false);
                }
                isLoadingRef.current = false;
            }
        };

        loadData();

        return () => {
            if (controller) {
                controller.abort();
            }
        };
    }, [session?.user?.id, isInitialized, settings.defaultCommission, settings.fuelEfficiency, settings.maintenanceFee, safeSetState, showToast, importInitialData]);

    const parseDate = (value) => {
        if (!value) return null;
        try {
            const parsed = parseISO(String(value));
            return isValid(parsed) ? parsed : null;
        } catch {
            return null;
        }
    };

    const parseNumber = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const getCommissionRate = (order) => {
        if (!order) return 0;
        const storedRate = parseNumber(order.commission_rate);
        if (storedRate > 0) return storedRate;
        return parseNumber(settings.defaultCommission) || 0;
    };

    const getGrossPrice = (order) => {
        if (!order) return 0;
        const storedGross = parseNumber(order.gross_price);
        if (storedGross > 0) return storedGross;
        const fallbackPrice = parseNumber(order.price);
        if (fallbackPrice <= 0) return 0;
        const rate = getCommissionRate(order);
        if (rate > 0 && rate < 1) return fallbackPrice / (1 - rate);
        return fallbackPrice;
    };

    const getNetProfit = (order) => {
        if (!order) return 0;
        const storedNet = parseNumber(order.net_profit);
        if (storedNet !== 0) return storedNet;
        const fallbackPrice = parseNumber(order.price);
        if (Number.isFinite(fallbackPrice) && fallbackPrice > 0) return fallbackPrice;
        const gross = getGrossPrice(order);
        const rate = getCommissionRate(order);
        return gross * (1 - rate);
    };

    const getAppFee = (order) => {
        if (!order) return 0;
        const storedFee = parseNumber(order.app_fee);
        if (storedFee > 0) return storedFee;
        const legacyFee = parseNumber(order.fee);
        if (legacyFee > 0) return legacyFee;
        const gross = getGrossPrice(order);
        const rate = getCommissionRate(order);
        return gross * rate;
    };

    const getFuelCost = (order) => {
        if (!order) return 0;
        const storedFuelCost = parseNumber(order.fuel_cost);
        if (storedFuelCost > 0) return storedFuelCost;
        const distance = parseNumber(order.distance);
        if (distance <= 0) return 0;
        const storedEfficiency = parseNumber(order.fuel_efficiency_at_time);
        const efficiency = storedEfficiency > 0
            ? storedEfficiency
            : parseNumber(settings.fuelEfficiency) || 0;
        return distance * efficiency;
    };

    const getMaintenanceCost = (order) => {
        if (!order) return 0;
        const storedMaintenance = parseNumber(order.maintenance_fee ?? order.maintenance_cost);
        if (storedMaintenance > 0) return storedMaintenance;
        return parseNumber(settings.maintenanceFee) || 0;
    };

    const getUpdatedFinancials = (order) => {
        if (!order) return { grossPrice: 0, commissionRate: 0, appFee: 0, netProfit: 0 };
        
        const grossFromOrder = parseNumber(order.gross_price);
        const fallbackGross = parseNumber(order.price);
        const grossPrice = grossFromOrder > 0
            ? grossFromOrder
            : fallbackGross > 0
                ? fallbackGross
                : 0;
        const commissionRate = getCommissionRate(order);
        const appFee = grossPrice * commissionRate;
        const netProfit = grossPrice - appFee;

        return {
            grossPrice,
            commissionRate,
            appFee,
            netProfit
        };
    };

    const calculateFinancials = useCallback((orders, expenses) => {
        if (!Array.isArray(orders)) orders = [];
        if (!Array.isArray(expenses)) expenses = [];

        const todayKey = getTodayKey();
        const todayOrders = orders.filter((order) =>
            order && toLocalDayKey(order.created_at) === todayKey
        );
        const todayExpenses = expenses.filter((expense) =>
            expense && toLocalDayKey(expense.created_at) === todayKey
        );
        const monthOrders = orders;
        const monthExpenses = expenses;

        const sumValues = (items, key) =>
            items.reduce((sum, item) => sum + parseNumber(item?.[key]), 0);
        const sumBy = (items, getter) =>
            items.reduce((sum, item) => {
                try {
                    return sum + getter(item);
                } catch (e) {
                    logger.warn('Error in sumBy getter:', e);
                    return sum;
                }
            }, 0);

        const todayNetProfit = sumBy(todayOrders, getNetProfit);
        const todayExpense = sumValues(todayExpenses, 'amount');
        const monthlyGross = sumBy(monthOrders, getGrossPrice);
        const monthlyNetProfit = sumBy(monthOrders, getNetProfit);
        const monthlyExpense = sumValues(monthExpenses, 'amount');
        const monthlyPotongan = sumBy(monthOrders, getAppFee);

        return {
            todayNetProfit: parseNumber(todayNetProfit),
            todayExpense: parseNumber(todayExpense),
            todayNet: parseNumber(todayNetProfit - todayExpense),
            monthlyGross: parseNumber(monthlyGross),
            monthlyNetProfit: parseNumber(monthlyNetProfit),
            monthlyExpense: parseNumber(monthlyExpense),
            monthlyNet: parseNumber(monthlyNetProfit - monthlyExpense),
            monthlyPotongan: parseNumber(monthlyPotongan),
            monthOrders,
            monthExpenses
        };
    }, []);

    // Refetch function untuk use after mutations
    const refetchData = useCallback(async () => {
        if (!session?.user || !isInitialized) {
            logger.debug('refetchData: Session or initialization not ready');
            return;
        }

        if (isLoadingRef.current) {
            logger.debug('refetchData: Already loading, skipping...');
            return;
        }

        try {
            isLoadingRef.current = true;
            safeSetState(setLoading, true);
            
            logger.debug('Refetching data from cache...');
            const orders = await getCachedOrders(session.user.id);
            const expenses = await getCachedExpenses(session.user.id);
            
            processFinancials(orders, expenses);

            // Trigger sync status update
            if (updateStatus && typeof updateStatus === 'function') {
                updateStatus();
            }

            logger.debug('Refetch completed successfully');
        } catch (error) {
            logger.error('Error refetching data from cache', error);
            showToast('Gagal memperbarui data: ' + (error?.message || 'Coba lagi'), 'error');
        } finally {
            safeSetState(setLoading, false);
            isLoadingRef.current = false;
        }
    }, [session?.user?.id, isInitialized, updateStatus, safeSetState, showToast]);

    const processFinancials = useCallback((orders, expenses) => {
        try {
            logger.debug('Processing financials...', {
                ordersCount: orders?.length || 0,
                expensesCount: expenses?.length || 0
            });

            // Store raw data for FeedbackCard
            safeSetState(setAllOrders, orders || []);
            safeSetState(setAllExpenses, expenses || []);

            const {
                todayNetProfit,
                todayExpense,
                todayNet,
                monthlyGross,
                monthlyNetProfit,
                monthlyExpense,
                monthlyNet,
                monthlyPotongan,
                monthOrders,
                monthExpenses
            } = calculateFinancials(orders, expenses);

            if (!isMountedRef.current) return;

            safeSetState(setTodayRecap, {
                income: todayNetProfit,
                expense: todayExpense,
                net: todayNet
            });
            
            // Kalkulasi Estimasi (Bensin & Potongan)
            const totalFuelCost = monthOrders.reduce((sum, order) => {
                try {
                    return sum + getFuelCost(order);
                } catch (e) {
                    logger.warn('Error calculating fuel cost:', e);
                    return sum;
                }
            }, 0);

            const totalMaintenanceCost = monthOrders.reduce((sum, order) => {
                try {
                    return sum + getMaintenanceCost(order);
                } catch (e) {
                    logger.warn('Error calculating maintenance cost:', e);
                    return sum;
                }
            }, 0);

            let efficiency = 0;
            if (monthlyGross > 0) {
                efficiency = (monthlyNetProfit / monthlyGross) * 100;
            }

            safeSetState(setMetrics, {
                grossIncome: monthlyGross,
                actualExpenses: monthlyExpense,
                netCash: monthlyNet,
                efficiencyScore: efficiency,
                appFeeTotal: monthlyPotongan,
                fuelCostTotal: totalFuelCost,
                maintenanceTotal: totalMaintenanceCost,
                ordersCount: monthOrders.length,
                expensesCount: monthExpenses.length
            });

            // Data Chart 7 Hari Terakhir
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(new Date(), 6 - i);
                return {
                    date: d,
                    label: format(d, 'dd/MM', { locale: id }),
                    net: 0
                };
            });

            const chart = last7Days.map(day => {
                try {
                    const dayOrders = monthOrders.filter((o) => {
                        if (!o) return false;
                        const orderDate = parseDate(o.created_at);
                        return orderDate ? isSameDay(orderDate, day.date) : false;
                    });
                    const dayExpenses = monthExpenses.filter((e) => {
                        if (!e) return false;
                        const expenseDate = parseDate(e.created_at);
                        return expenseDate ? isSameDay(expenseDate, day.date) : false;
                    });
                    const dailyIncome = dayOrders.reduce((s, o) => s + getNetProfit(o), 0);
                    const dailyExpense = dayExpenses.reduce((s, e) => s + parseNumber(e?.amount), 0);
                    return { ...day, net: dailyIncome - dailyExpense };
                } catch (e) {
                    logger.warn('Error processing chart data for day:', e);
                    return day;
                }
            });
            
            safeSetState(setChartData, chart);

            // Rekap Harian dengan consistent local day key
            const dailyRecap = monthOrders.reduce((acc, order) => {
                if (!order) return acc;
                const key = toLocalDayKey(order.created_at);
                if (!key) return acc;
                const orderDate = parseDate(order.created_at);
                if (!acc[key]) {
                    acc[key] = {
                        date: orderDate,
                        income: 0,
                        expense: 0
                    };
                }
                acc[key].income += getNetProfit(order);
                return acc;
            }, {});

            monthExpenses.forEach((expense) => {
                if (!expense) return;
                const key = toLocalDayKey(expense.created_at);
                if (!key) return;
                const expenseDate = parseDate(expense.created_at);
                if (!dailyRecap[key]) {
                    dailyRecap[key] = {
                        date: expenseDate,
                        income: 0,
                        expense: 0
                    };
                }
                dailyRecap[key].expense += parseNumber(expense?.amount) || 0;
            });

            const dailyRecapList = Object.values(dailyRecap)
                .filter(item => item && item.date)
                .sort((a, b) => (b?.date?.getTime() || 0) - (a?.date?.getTime() || 0))
                .map((item) => ({
                    ...item,
                    net: (item?.income || 0) - (item?.expense || 0)
                }));

            safeSetState(setDailyRecapData, dailyRecapList);

            // Combined transactions
            const combined = [
                ...monthOrders.map(o => {
                    if (!o) return null;
                    if (!o.client_tx_id) {
                        logger.warn('Order missing client_tx_id, using id as fallback', { id: o.id });
                    }
                    return { 
                        ...o, 
                        type: 'income', 
                        displayAmount: getNetProfit(o),
                        client_tx_id: o.client_tx_id || `legacy-${o.id}`, 
                    };
                }).filter(Boolean),
                ...monthExpenses.map(e => {
                    if (!e) return null;
                    if (!e.client_tx_id) {
                        logger.warn('Expense missing client_tx_id, using id as fallback', { id: e.id });
                    }
                    return { 
                        ...e, 
                        type: 'expense', 
                        displayAmount: parseNumber(e.amount),
                        client_tx_id: e.client_tx_id || `legacy-${e.id}`,
                    };
                }).filter(Boolean)
            ].sort((a, b) => {
                const dateA = parseDate(a?.created_at);
                const dateB = parseDate(b?.created_at);
                return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
            });

            safeSetState(setTransactions, combined);
            safeSetState(setVisibleCount, pageSize);

            logger.debug('Financial processing completed', {
                transactionsCount: combined.length,
                todayNet: todayNet,
                monthlyNet: monthlyNet
            });
        } catch (error) {
            logger.error('Error processing financials:', error);
            showToast('Terjadi kesalahan dalam memproses data', 'error');
        }
    }, [calculateFinancials, safeSetState, showToast, pageSize]);

    const formatCurrency = (val) => {
        const num = parseNumber(val);
        return new Intl.NumberFormat('id-ID').format(num);
    };
    const formatTime = (iso) => {
        const parsed = iso ? parseISO(iso) : null;
        if (!parsed || !isValid(parsed)) return '--:--';
        return format(parsed, 'HH:mm');
    };

    const requestDelete = (clientTxId, type) => {
        setDeleteTargetId(clientTxId);
        setDeleteTargetType(type);
    };

    const closeDeleteModal = () => {
        setDeleteTargetId(null);
        setDeleteTargetType(null);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId || !deleteTargetType) return;
        try {
            // Use offline-first delete (soft delete)
            if (deleteTargetType === 'income') {
                await deleteOrder(deleteTargetId);
            } else {
                await deleteExpense(deleteTargetId);
            }
            
            logger.info('Transaction deleted offline', { 
                id: deleteTargetId, 
                type: deleteTargetType 
            });

            await refetchData();
            closeDeleteModal();
            showToast('Data berhasil dihapus!', 'success');
        } catch (error) {
            logger.error('Error deleting transaction', error);
            showToast('Terjadi kesalahan: ' + (error.message || 'Gagal menghapus transaksi.'), 'error');
        }
    };

    const handleUpdateOrder = async (updatedOrder) => {
        if (!updatedOrder.client_tx_id) {
            showToast('Terjadi kesalahan: ID Order tidak ditemukan.', 'error');
            return;
        }

        if (!updatedOrder.created_at) {
            showToast('Tanggal & waktu order tidak boleh kosong.', 'error');
            return;
        }

        const { grossPrice, commissionRate, appFee, netProfit } = getUpdatedFinancials(updatedOrder);

        try {
            // Use offline-first update
            await updateOrder(updatedOrder.client_tx_id, {
                price: netProfit,
                gross_price: grossPrice,
                commission_rate: commissionRate,
                app_fee: appFee,
                net_profit: netProfit,
                distance: updatedOrder.distance,
                created_at: updatedOrder.created_at
            });

            logger.info('Order updated offline', { client_tx_id: updatedOrder.client_tx_id });

            await refetchData();

            setEditingOrder(null);
            showToast('Data berhasil disimpan!', 'success');
        } catch (error) {
            logger.error('Failed to update order', error);
            showToast('Terjadi kesalahan: ' + (error.message || 'Terjadi kesalahan sistem'), 'error');
        }
    };


    const visibleTransactions = transactions.slice(0, visibleCount);
    const canLoadMore = visibleCount < transactions.length;

    const handleLoadMore = () => {
        setVisibleCount((prev) => Math.min(prev + pageSize, transactions.length));
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-ui-background">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-ui-primary border-t-transparent"></div>
            </div>
        );
    }

    if (fetchStatus === 'error' && fetchError) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-ui-background px-4">
                <AlertCircle className="w-12 h-12 text-ui-danger mb-4" />
                <h2 className="text-lg font-bold text-ui-text mb-2">Gagal Memuat Data</h2>
                <p className="text-sm text-ui-muted text-center mb-4">{fetchError}</p>
                <PrimaryButton
                    type="button"
                    onClick={() => {
                        setFetchStatus('idle');
                        setFetchError(null);
                    }}
                    className="bg-ui-primary text-ui-inverse"
                >
                    Coba Lagi
                </PrimaryButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-ui-background relative">
            {/* Sync Status Banner */}
            <SyncStatusBanner />
            
            {/* Header */}
            <div className="px-4 pt-5 pb-3 bg-ui-background sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-ui-text font-display">Financial Board</h1>
                <SectionTitle className="text-[10px] tracking-[0.3em]">Liputan Keuangan Bulan Ini</SectionTitle>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 pb-24">
                {/* Feedback Card - Daily-first actionable insights */}
                <FeedbackCard 
                    orders={allOrders} 
                    expenses={allExpenses} 
                    settings={settings}
                    onAddTransaction={() => setShowExpenseModal(true)}
                />

                <div className="space-y-4">
                {/* --- KARTU REKAP HARIAN (SETORAN) --- */}
                <Card className="bg-gradient-to-br from-ui-success via-ui-primary to-ui-info p-4 text-ui-inverse border-ui-success/40 shadow-ui-lg">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap justify-between gap-3 text-sm font-semibold">
                            <span className="text-ui-inverse/80">
                                Pemasukan: <span className="text-ui-inverse">Rp {formatCurrency(todayRecap.income)}</span>
                            </span>
                            <span className="text-ui-inverse/70">
                                Pengeluaran: <span className="text-ui-inverse">Rp {formatCurrency(todayRecap.expense)}</span>
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <SectionTitle className="text-ui-inverse/70">Siap Setor / Sisa Hari Ini</SectionTitle>
                            <span className="text-3xl font-extrabold tracking-tight">
                                Rp {formatCurrency(todayRecap.net)}
                            </span>
                            {todayRecap.net < 0 && (
                                <span className="inline-block bg-ui-danger/20 px-2 py-1 rounded-ui-sm text-xs font-bold text-ui-inverse border border-ui-danger/40 w-fit">
                                    ⚠️ Minus (Pakai Modal)
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                {/* --- TOMBOL TAB STATISTIK --- */}
                <div className="grid grid-cols-3 gap-2">
                    <Card
                        className={`p-0 transition-all duration-200 ${activeRecap === 'omzet'
                            ? 'border-ui-success/50 ring-2 ring-ui-success/30 shadow-ui-md bg-ui-success/5'
                            : 'hover:border-ui-success/30 hover:shadow-ui-sm'}`}
                    >
                        <button
                            type="button"
                            onClick={() => setActiveRecap('omzet')}
                            className="flex h-full w-full flex-col justify-between p-2 text-left transition-transform duration-200 active:scale-95 press-effect"
                        >
                            <div className={`p-1.5 rounded-ui-sm w-fit transition-colors duration-200 ${activeRecap === 'omzet' ? 'bg-ui-success/20' : 'bg-ui-success/10'}`}>
                                <TrendingUp size={14} className="text-ui-success" />
                            </div>
                            <div className="mt-2">
                                <SectionTitle className="text-[8px] !tracking-normal">Omzet</SectionTitle>
                                <p className="text-xs font-bold text-ui-text truncate mt-0.5">
                                    {formatCurrency(metrics.grossIncome)}
                                </p>
                            </div>
                        </button>
                    </Card>

                    <Card
                        className={`p-0 transition-all duration-200 ${activeRecap === 'pengeluaran'
                            ? 'border-ui-danger/50 ring-2 ring-ui-danger/30 shadow-ui-md bg-ui-danger/5'
                            : 'hover:border-ui-danger/30 hover:shadow-ui-sm'}`}
                    >
                        <button
                            type="button"
                            onClick={() => setActiveRecap('pengeluaran')}
                            className="flex h-full w-full flex-col justify-between p-2 text-left transition-transform duration-200 active:scale-95 press-effect"
                        >
                            <div className={`p-1.5 rounded-ui-sm w-fit transition-colors duration-200 ${activeRecap === 'pengeluaran' ? 'bg-ui-danger/20' : 'bg-ui-danger/10'}`}>
                                <TrendingDown size={14} className="text-ui-danger" />
                            </div>
                            <div className="mt-2">
                                <SectionTitle className="text-[8px] !tracking-normal">Pengeluaran</SectionTitle>
                                <p className="text-xs font-bold text-ui-text truncate mt-0.5">
                                    {formatCurrency(metrics.actualExpenses)}
                                </p>
                            </div>
                        </button>
                    </Card>

                    <Card
                        className={`p-0 transition-all duration-200 ${activeRecap === 'potongan'
                            ? 'border-ui-warning/50 ring-2 ring-ui-warning/30 shadow-ui-md bg-ui-warning/5'
                            : 'hover:border-ui-warning/30 hover:shadow-ui-sm'}`}
                    >
                        <button
                            type="button"
                            onClick={() => setActiveRecap('potongan')}
                            className="flex h-full w-full flex-col justify-between p-2 text-left transition-transform duration-200 active:scale-95 press-effect"
                        >
                            <div className={`p-1.5 rounded-ui-sm w-fit transition-colors duration-200 ${activeRecap === 'potongan' ? 'bg-ui-warning/20' : 'bg-ui-warning/10'}`}>
                                <Wallet size={14} className="text-ui-warning" />
                            </div>
                            <div className="mt-2">
                                <SectionTitle className="text-[8px] !tracking-normal">Potongan</SectionTitle>
                                <p className="text-xs font-bold text-ui-text truncate mt-0.5">
                                    {formatCurrency(metrics.appFeeTotal + metrics.fuelCostTotal + metrics.maintenanceTotal)}
                                </p>
                            </div>
                        </button>
                    </Card>
                </div>

                {/* --- DETAIL STATISTIK --- */}
                <Card className="p-4">
                    {activeRecap === 'omzet' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ui-muted">Total Omzet (Gross) Bulan Ini</span>
                                <span className="font-bold text-ui-text">
                                    {formatCurrency(metrics.grossIncome)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ui-muted">Jumlah Order</span>
                                <span className="font-semibold text-ui-text">
                                    {metrics.ordersCount} trip
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm border-t pt-2 border-ui-border/70">
                                <span className="text-ui-muted">Net Profit</span>
                                <span className="font-bold text-ui-success">
                                    {formatCurrency(metrics.netCash)}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {activeRecap === 'pengeluaran' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ui-muted">Total Pengeluaran</span>
                                <span className="font-bold text-ui-text">
                                    {formatCurrency(metrics.actualExpenses)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ui-muted">Jumlah Transaksi</span>
                                <span className="font-semibold text-ui-text">
                                    {metrics.expensesCount} item
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {activeRecap === 'potongan' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ui-muted">Estimasi Potongan Aplikasi</span>
                                <span className="font-semibold text-ui-warning">
                                    -{formatCurrency(metrics.appFeeTotal)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ui-muted">Estimasi Bensin</span>
                                <span className="font-semibold text-ui-warning">
                                    -{formatCurrency(metrics.fuelCostTotal)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ui-muted">Estimasi Maintenance</span>
                                <span className="font-semibold text-ui-warning">
                                    -{formatCurrency(metrics.maintenanceTotal)}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </Card>

                {/* --- REKAP HARIAN --- */}
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <SectionTitle className="text-[10px] tracking-[0.25em]">Rekap Harian Bulan Ini</SectionTitle>
                        <span className="text-xs text-ui-muted">Arus kas per hari</span>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {dailyRecapData.length === 0 ? (
                            <div className="text-center py-6 text-ui-muted text-sm">
                                Belum ada rekap harian.
                            </div>
                        ) : (
                            dailyRecapData.map((recap) => (
                                <div
                                    key={format(recap.date, 'yyyy-MM-dd')}
                                    className="flex items-center justify-between rounded-ui-lg border border-ui-border px-4 py-3"
                                >
                                    <div>
                                        <p className="text-xs text-ui-muted">
                                            {format(recap.date, 'EEEE, dd MMM', { locale: id })}
                                        </p>
                                        <p className="text-sm font-semibold text-ui-text">
                                            {format(recap.date, 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-ui-muted">
                                            Masuk: <span className="text-ui-success">+{formatCurrency(recap.income)}</span>
                                        </p>
                                        <p className="text-xs text-ui-muted">
                                            Keluar: <span className="text-ui-danger">-{formatCurrency(recap.expense)}</span>
                                        </p>
                                        <p className={`text-sm font-bold ${recap.net >= 0 ? 'text-ui-success' : 'text-ui-danger'}`}>
                                            {recap.net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(recap.net))}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* --- CHART 7 HARI --- */}
                <Card className="p-3 w-full overflow-hidden">
                   <SectionTitle className="mb-3 text-[10px] tracking-[0.25em]">Tren 7 Hari Terakhir</SectionTitle>
                   {chartData && chartData.length > 0 ? (
                     <div className="w-full" style={{ height: '220px', minHeight: '220px' }}>
                       <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                         <BarChart 
                           data={chartData} 
                           margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                         >
                            <XAxis 
                               dataKey="label" 
                               axisLine={false} 
                               tickLine={false} 
                               tick={{fontSize: 11, fill: 'var(--ui-color-muted)'}} 
                            />
                            <Tooltip 
                               cursor={{fill: 'transparent'}}
                               contentStyle={{
                                 borderRadius: '8px', 
                                 border: 'none', 
                                 boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                 fontSize: '12px'
                               }}
                            />
                            <Bar dataKey="net" radius={[4, 4, 0, 0]} maxBarSize={40}>
                               {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.net >= 0 ? 'var(--ui-color-success)' : 'var(--ui-color-danger)'} />
                               ))}
                            </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                   ) : (
                     <div className="h-40 w-full flex items-center justify-center text-ui-muted text-sm">
                       Belum ada data untuk ditampilkan
                     </div>
                   )}
                </Card>

                {/* --- DAFTAR TRANSAKSI --- */}
                <div className="pb-10">
                    <SectionTitle className="mb-3 px-1 text-[10px] tracking-[0.25em]">Riwayat Transaksi</SectionTitle>
                    <div className="space-y-3">
                        {visibleTransactions.length === 0 ? (
                            <div className="text-center py-8 text-ui-muted text-sm">
                                Belum ada data hari ini.
                            </div>
                        ) : (
                            visibleTransactions.map((t) => (
                                <Card key={`${t.type}-${t.id}`} className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${
                                            t.type === 'income' 
                                            ? 'bg-ui-success/10 text-ui-success' 
                                            : 'bg-ui-danger/10 text-ui-danger'
                                        }`}>
                                            {t.type === 'income' ? <Plus size={18} /> : <Minus size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-ui-text text-sm">
                                                {t.type === 'income' ? 'Order Masuk' : (t.category || 'Pengeluaran')}
                                            </p>
                                            <p className="text-xs text-ui-muted">
                                                {formatTime(t.created_at)} • {t.type === 'income' ? `${t.distance || 0} km` : t.note || t.description || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-sm ${t.type === 'income' ? 'text-ui-success' : 'text-ui-danger'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.displayAmount)}
                                        </p>
                                        <div className="mt-1 flex items-center justify-end gap-2">
                                            {t.type === 'income' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingOrder(t)}
                                                    className="text-xs text-ui-muted hover:text-ui-primary flex items-center gap-1 min-h-[44px] px-2 press-effect"
                                                    style={{ minHeight: '44px', touchAction: 'manipulation' }}
                                                >
                                                    <Edit2 size={14} /> Edit
                                                </button>
                                            )}
                                            <button 
                                                type="button"
                                                onClick={() => requestDelete(t.client_tx_id, t.type)}
                                                className="text-xs text-ui-muted hover:text-ui-danger flex items-center gap-1 min-h-[44px] px-2 press-effect"
                                                style={{ minHeight: '44px', touchAction: 'manipulation' }}
                                            >
                                               <Trash2 size={14} /> Hapus
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                    {canLoadMore && (
                        <div className="flex justify-center pt-4 pb-4">
                            <PrimaryButton
                                type="button"
                                onClick={handleLoadMore}
                                className="rounded-full bg-ui-surface px-4 py-2 text-sm font-semibold text-ui-text border border-ui-border shadow-none hover:bg-ui-surface-muted press-effect"
                            >
                                Muat lebih banyak
                            </PrimaryButton>
                        </div>
                    )}
                </div>
                </div>
            </div>

            {/* Tombol Tambah Pengeluaran - FAB */}
            <div 
                className="fixed z-[999997]"
                style={{
                    bottom: 'max(calc(var(--nav-total-height, 80px) + 16px), calc(env(safe-area-inset-bottom) + 80px))',
                    right: 'max(16px, env(safe-area-inset-right, 16px))'
                }}
            >
                <PrimaryButton
                    type="button"
                    onClick={() => setShowExpenseModal(true)}
                    className="bg-ui-danger hover:bg-ui-danger/90 text-ui-inverse shadow-ui-lg transition-all active:scale-90 press-effect"
                    style={{
                        width: '56px',
                        height: '56px',
                        minWidth: '56px',
                        minHeight: '56px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                    }}
                    aria-label="Tambah pengeluaran"
                >
                    <Minus size={24} />
                </PrimaryButton>
            </div>

            <ExpenseModal
                isOpen={showExpenseModal}
                onClose={() => {
                    setShowExpenseModal(false);
                    refetchData(); // Refresh after expense added
                }}
                showToast={showToast}
            />

            <EditOrderModal
                isOpen={Boolean(editingOrder)}
                onClose={() => setEditingOrder(null)}
                order={editingOrder}
                onSave={handleUpdateOrder}
                showToast={showToast}
            />

            <ConfirmationModal
                isOpen={Boolean(deleteTargetId)}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Hapus Transaksi?"
                message="Apakah Anda yakin ingin menghapus data ini? Data tidak dapat dikembalikan."
                isDestructive={true}
            />
        </div>
    );
}
