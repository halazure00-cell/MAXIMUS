import { getTodayKey, toLocalDayKey } from './dateUtils';

/**
 * Format number to Rupiah string without "Rp" prefix
 * @param {number} value - The numeric value
 * @returns {string} Formatted string (e.g., "12.500")
 */
export function formatRupiah(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '0';
    return Math.abs(Math.round(value)).toLocaleString('id-ID');
}

/**
 * Safe ratio calculation with fallback
 * @param {number} numerator
 * @param {number} denominator
 * @returns {number} Ratio (0-1) or 0 if invalid
 */
export function safeRatio(numerator, denominator) {
    if (typeof numerator !== 'number' || typeof denominator !== 'number') return 0;
    if (denominator === 0 || !Number.isFinite(denominator)) return 0;
    const ratio = numerator / denominator;
    return Number.isFinite(ratio) ? ratio : 0;
}

/**
 * Parse number safely
 * @param {*} value
 * @returns {number}
 */
function parseNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Get commission rate from order
 */
function getCommissionRate(order, defaultCommission) {
    if (!order) return 0;
    const storedRate = parseNumber(order.commission_rate);
    if (storedRate > 0) return storedRate;
    return parseNumber(defaultCommission) || 0;
}

/**
 * Get gross price from order
 */
function getGrossPrice(order, defaultCommission) {
    if (!order) return 0;
    const storedGross = parseNumber(order.gross_price);
    if (storedGross > 0) return storedGross;
    const fallbackPrice = parseNumber(order.price);
    if (fallbackPrice <= 0) return 0;
    const rate = getCommissionRate(order, defaultCommission);
    if (rate > 0 && rate < 1) return fallbackPrice / (1 - rate);
    return fallbackPrice;
}

/**
 * Get net profit from order
 */
function getNetProfit(order, defaultCommission) {
    if (!order) return 0;
    const storedNet = parseNumber(order.net_profit);
    if (storedNet !== 0) return storedNet;
    const fallbackPrice = parseNumber(order.price);
    if (Number.isFinite(fallbackPrice) && fallbackPrice > 0) return fallbackPrice;
    const gross = getGrossPrice(order, defaultCommission);
    const rate = getCommissionRate(order, defaultCommission);
    return gross * (1 - rate);
}

/**
 * Get app fee from order
 */
function getAppFee(order, defaultCommission) {
    if (!order) return 0;
    const storedFee = parseNumber(order.app_fee);
    if (storedFee > 0) return storedFee;
    const legacyFee = parseNumber(order.fee);
    if (legacyFee > 0) return legacyFee;
    const gross = getGrossPrice(order, defaultCommission);
    const rate = getCommissionRate(order, defaultCommission);
    return gross * rate;
}

/**
 * Get fuel cost from order
 */
function getFuelCost(order, settings) {
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
}

/**
 * Get maintenance cost from order
 */
function getMaintenanceCost(order, settings) {
    if (!order) return 0;
    const storedMaintenance = parseNumber(order.maintenance_fee ?? order.maintenance_cost);
    if (storedMaintenance > 0) return storedMaintenance;
    return parseNumber(settings.maintenanceFee) || 0;
}

/**
 * Build daily metrics from orders and expenses
 * @param {Array} orders - All orders
 * @param {Array} expenses - All expenses
 * @param {Object} settings - User settings
 * @returns {Object} Daily metrics
 */
export function buildDailyMetrics(orders, expenses, settings) {
    if (!Array.isArray(orders)) orders = [];
    if (!Array.isArray(expenses)) expenses = [];
    if (!settings) settings = {};

    const todayKey = getTodayKey();
    
    // Filter today's data
    const todayOrders = orders.filter(order => 
        order && toLocalDayKey(order.created_at) === todayKey
    );
    const todayExpenses = expenses.filter(expense => 
        expense && toLocalDayKey(expense.created_at) === todayKey
    );

    // Calculate metrics
    const pemasukan = todayOrders.reduce((sum, order) => 
        sum + getNetProfit(order, settings.defaultCommission), 0
    );
    
    const potongan = todayOrders.reduce((sum, order) => 
        sum + getAppFee(order, settings.defaultCommission), 0
    );
    
    const bensin = todayOrders.reduce((sum, order) => 
        sum + getFuelCost(order, settings), 0
    );
    
    const maintenance = todayOrders.reduce((sum, order) => 
        sum + getMaintenanceCost(order, settings), 0
    );
    
    const pengeluaran = todayExpenses.reduce((sum, expense) => 
        sum + parseNumber(expense.amount), 0
    );

    const netCashflow = pemasukan - pengeluaran;

    return {
        pemasukan,
        potongan,
        bensin,
        maintenance,
        pengeluaran,
        netCashflow,
        ordersCount: todayOrders.length,
        expensesCount: todayExpenses.length
    };
}

/**
 * Build monthly metrics from orders and expenses
 * @param {Array} orders - All orders
 * @param {Array} expenses - All expenses
 * @param {Object} settings - User settings
 * @returns {Object} Monthly metrics
 */
export function buildMonthlyMetrics(orders, expenses, settings) {
    if (!Array.isArray(orders)) orders = [];
    if (!Array.isArray(expenses)) expenses = [];
    if (!settings) settings = {};

    // Monthly = all data (assuming data is already filtered by month elsewhere)
    const pemasukan = orders.reduce((sum, order) => 
        sum + getNetProfit(order, settings.defaultCommission), 0
    );
    
    const potongan = orders.reduce((sum, order) => 
        sum + getAppFee(order, settings.defaultCommission), 0
    );
    
    const bensin = orders.reduce((sum, order) => 
        sum + getFuelCost(order, settings), 0
    );
    
    const maintenance = orders.reduce((sum, order) => 
        sum + getMaintenanceCost(order, settings), 0
    );
    
    const pengeluaran = expenses.reduce((sum, expense) => 
        sum + parseNumber(expense.amount), 0
    );

    const netCashflow = pemasukan - pengeluaran;

    return {
        pemasukan,
        potongan,
        bensin,
        maintenance,
        pengeluaran,
        netCashflow,
        ordersCount: orders.length,
        expensesCount: expenses.length
    };
}

/**
 * Determine top leakage driver
 * @param {Object} metrics
 * @returns {Object} { key, label, amount }
 */
export function topDriver(metrics) {
    const drivers = [
        { key: 'potongan', label: 'potongan', amount: metrics.potongan || 0 },
        { key: 'bensin', label: 'bensin', amount: metrics.bensin || 0 },
        { key: 'maintenance', label: 'maintenance', amount: metrics.maintenance || 0 },
        { key: 'pengeluaran', label: 'pengeluaran', amount: metrics.pengeluaran || 0 }
    ];

    // Find max
    let max = drivers[0];
    for (let i = 1; i < drivers.length; i++) {
        if (drivers[i].amount > max.amount) {
            max = drivers[i];
        }
    }

    return max;
}

/**
 * Determine status based on net cashflow and pemasukan
 * @param {number} netCashflow
 * @param {number} pemasukan
 * @returns {string} Status: DEFISIT | TIPIS | MENDEKATI_TARGET | AMAN | SANGAT_BAGUS
 */
function determineStatus(netCashflow, pemasukan) {
    if (netCashflow < 0) return 'DEFISIT';
    
    if (pemasukan === 0) return 'TIPIS';
    
    const netRatio = safeRatio(netCashflow, pemasukan);
    
    if (netRatio < 0.2) return 'TIPIS';
    if (netRatio < 0.4) return 'MENDEKATI_TARGET';
    if (netRatio < 0.7) return 'AMAN';
    return 'SANGAT_BAGUS';
}

/**
 * Get status display text
 */
function getStatusText(status) {
    const map = {
        'DEFISIT': 'defisit',
        'TIPIS': 'tipis',
        'MENDEKATI_TARGET': 'mendekati target',
        'AMAN': 'aman',
        'SANGAT_BAGUS': 'sangat bagus'
    };
    return map[status] || 'normal';
}

/**
 * Get status color
 */
export function getStatusColor(status) {
    const map = {
        'DEFISIT': 'danger',
        'TIPIS': 'warning',
        'MENDEKATI_TARGET': 'warning',
        'AMAN': 'success',
        'SANGAT_BAGUS': 'success'
    };
    return map[status] || 'muted';
}

/**
 * Generate actionable feedback based on metrics
 */
function generateAction(metrics, driver) {
    const { netCashflow, pemasukan, pengeluaran, ordersCount } = metrics;
    
    // No data
    if (ordersCount === 0 && pengeluaran === 0) {
        return 'Tambah transaksi untuk mulai tracking';
    }
    
    // No income
    if (pemasukan === 0 && pengeluaran > 0) {
        return 'Prioritas: cari orderan untuk cover pengeluaran';
    }
    
    // No expenses
    if (pemasukan > 0 && pengeluaran === 0) {
        return 'Maintain ritme kerja, catat semua pengeluaran';
    }
    
    // Deficit
    if (netCashflow < 0) {
        return 'Tahan belanja non-operasional sampai net positif';
    }
    
    // Low margin
    const netRatio = safeRatio(netCashflow, pemasukan);
    if (netRatio < 0.3) {
        if (driver.key === 'pengeluaran') {
            return 'Kurangi pengeluaran tidak penting';
        } else if (driver.key === 'bensin') {
            return 'Optimalkan rute untuk hemat bensin';
        }
        return 'Naikkan efisiensi, kurangi kebocoran';
    }
    
    // Good performance
    if (netRatio >= 0.7) {
        return 'Pertahankan! Sisihkan untuk tabungan';
    }
    
    // Default
    return 'Maintain efisiensi, catat semua transaksi';
}

/**
 * Generate daily feedback (3 lines: headline, reason, action)
 * @param {Object} metrics - Daily metrics
 * @returns {Object} { headline, reason, action, status }
 */
export function generateDailyFeedback(metrics) {
    const { pemasukan, pengeluaran, netCashflow, ordersCount, expensesCount } = metrics;
    
    // Empty state: no data at all
    if (ordersCount === 0 && expensesCount === 0) {
        return {
            headline: 'Belum ada transaksi hari ini',
            reason: 'Tidak ada pemasukan atau pengeluaran tercatat',
            action: 'Tambah transaksi untuk mulai tracking',
            status: 'TIPIS',
            isEmpty: true
        };
    }
    
    // Only expenses
    if (pemasukan === 0 && pengeluaran > 0) {
        return {
            headline: `Hari ini pengeluaran Rp ${formatRupiah(pengeluaran)}, belum ada pemasukan`,
            reason: 'Belum ada orderan yang tercatat',
            action: 'Prioritas: cari orderan untuk cover pengeluaran',
            status: 'DEFISIT',
            isEmpty: false
        };
    }
    
    // Only income
    if (pemasukan > 0 && pengeluaran === 0) {
        return {
            headline: `Hari ini pemasukan Rp ${formatRupiah(pemasukan)}, belum ada pengeluaran`,
            reason: 'Semua pemasukan masih utuh',
            action: 'Maintain ritme kerja, catat semua pengeluaran',
            status: 'SANGAT_BAGUS',
            isEmpty: false
        };
    }
    
    // Normal case: both income and expenses exist
    const status = determineStatus(netCashflow, pemasukan);
    const statusText = getStatusText(status);
    const driver = topDriver(metrics);
    const action = generateAction(metrics, driver);
    
    // Headline
    const headline = netCashflow >= 0
        ? `Hari ini ${statusText}, net Rp ${formatRupiah(netCashflow)}`
        : `Hari ini ${statusText} Rp ${formatRupiah(Math.abs(netCashflow))}`;
    
    // Reason
    const reason = `Terbesar: ${driver.label} Rp ${formatRupiah(driver.amount)}`;
    
    return {
        headline,
        reason,
        action,
        status,
        isEmpty: false
    };
}

/**
 * Generate monthly feedback (3 lines: headline, reason, action)
 * @param {Object} metrics - Monthly metrics
 * @returns {Object} { headline, reason, action, status }
 */
export function generateMonthlyFeedback(metrics) {
    const { pemasukan, pengeluaran, netCashflow, ordersCount, expensesCount } = metrics;
    
    // Empty state
    if (ordersCount === 0 && expensesCount === 0) {
        return {
            headline: 'Belum ada transaksi bulan ini',
            reason: 'Tidak ada pemasukan atau pengeluaran tercatat',
            action: 'Tambah transaksi untuk mulai tracking',
            status: 'TIPIS',
            isEmpty: true
        };
    }
    
    // Only expenses
    if (pemasukan === 0 && pengeluaran > 0) {
        return {
            headline: `Bulan ini pengeluaran Rp ${formatRupiah(pengeluaran)}, belum ada pemasukan`,
            reason: 'Belum ada orderan yang tercatat',
            action: 'Prioritas: cari orderan untuk cover pengeluaran',
            status: 'DEFISIT',
            isEmpty: false
        };
    }
    
    // Only income
    if (pemasukan > 0 && pengeluaran === 0) {
        return {
            headline: `Bulan ini pemasukan Rp ${formatRupiah(pemasukan)}, belum ada pengeluaran`,
            reason: 'Semua pemasukan masih utuh',
            action: 'Maintain ritme kerja, catat semua pengeluaran',
            status: 'SANGAT_BAGUS',
            isEmpty: false
        };
    }
    
    // Normal case
    const status = determineStatus(netCashflow, pemasukan);
    const statusText = getStatusText(status);
    const driver = topDriver(metrics);
    const action = generateAction(metrics, driver);
    
    // Headline
    const headline = netCashflow >= 0
        ? `Bulan ini ${statusText}, net Rp ${formatRupiah(netCashflow)}`
        : `Bulan ini ${statusText} Rp ${formatRupiah(Math.abs(netCashflow))}`;
    
    // Reason
    const reason = `Terbesar: ${driver.label} Rp ${formatRupiah(driver.amount)}`;
    
    return {
        headline,
        reason,
        action,
        status,
        isEmpty: false
    };
}
