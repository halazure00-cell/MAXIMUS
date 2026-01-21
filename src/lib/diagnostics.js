/**
 * Diagnostics and Bug Reporting Toolkit
 * Provides error classification, logging, and WhatsApp report generation
 * NO SENSITIVE DATA - safe for beta testers
 */

const ERROR_LOG_KEY = 'maximus_error_logs';
const MAX_ERROR_LOGS = 20;

/**
 * Classify error into predefined categories
 * @param {Error|object} err - Error object or error-like object
 * @returns {object} - { type, code, messageShort, retryableHint, httpStatus?, pgCode?, op?, table? }
 */
export function classifyError(err) {
  const errMsg = (err?.message || err?.msg || String(err) || '').toLowerCase();
  const errCode = err?.code || err?.error_code || '';
  const pgCode = err?.pgCode || err?.code || '';
  const httpStatus = err?.status || err?.statusCode || err?.httpStatus;

  // RLS / Permission Denied
  if (
    errMsg.includes('permission denied') ||
    errMsg.includes('rls') ||
    errMsg.includes('row level security') ||
    errMsg.includes('new row violates') ||
    pgCode === '42501' ||
    errCode === 'PGRST301'
  ) {
    return {
      type: 'permission',
      code: 'RLS_DENIED',
      messageShort: 'Akses ditolak (RLS/permission)',
      retryableHint: false,
      pgCode: pgCode || '42501',
      httpStatus: httpStatus || 403,
      op: err?.op,
      table: err?.table,
    };
  }

  // Schema mismatch (missing column/table)
  if (
    errMsg.includes('column') && (errMsg.includes('does not exist') || errMsg.includes('not found')) ||
    errMsg.includes('relation') && errMsg.includes('does not exist') ||
    errMsg.includes('table') && errMsg.includes('does not exist') ||
    pgCode === '42703' || // undefined column
    pgCode === '42P01'    // undefined table
  ) {
    return {
      type: 'schema',
      code: 'SCHEMA_MISMATCH',
      messageShort: 'Kolom/tabel tidak ditemukan (schema)',
      retryableHint: false,
      pgCode: pgCode || '42703',
      httpStatus: httpStatus || 400,
      op: err?.op,
      table: err?.table,
    };
  }

  // Network / offline
  if (
    errMsg.includes('failed to fetch') ||
    errMsg.includes('network request failed') ||
    errMsg.includes('networkerror') ||
    errMsg.includes('fetch failed') ||
    errMsg.includes('offline') ||
    errCode === 'NETWORK_ERROR' ||
    !navigator.onLine
  ) {
    return {
      type: 'network',
      code: 'NETWORK_OFFLINE',
      messageShort: 'Koneksi offline/gagal',
      retryableHint: true,
      httpStatus: httpStatus || 0,
    };
  }

  // Rate limit
  if (
    httpStatus === 429 ||
    errMsg.includes('rate limit') ||
    errMsg.includes('too many requests')
  ) {
    return {
      type: 'rate_limit',
      code: 'RATE_LIMIT',
      messageShort: 'Terlalu banyak permintaan (rate limit)',
      retryableHint: true,
      httpStatus: 429,
    };
  }

  // Timeout
  if (
    errMsg.includes('timeout') ||
    errMsg.includes('timed out') ||
    errCode === 'ETIMEDOUT' ||
    errCode === 'TIMEOUT'
  ) {
    return {
      type: 'timeout',
      code: 'TIMEOUT',
      messageShort: 'Waktu permintaan habis (timeout)',
      retryableHint: true,
      httpStatus: httpStatus || 408,
    };
  }

  // Unknown
  return {
    type: 'unknown',
    code: 'UNKNOWN',
    messageShort: errMsg.substring(0, 100) || 'Error tidak diketahui',
    retryableHint: false,
    httpStatus,
    pgCode,
  };
}

/**
 * Add error to local ring buffer (max 20)
 * @param {object} errorEntry - { tsIso, route, code, messageShort, context? }
 */
export function addErrorLog(errorEntry) {
  try {
    const logs = getErrorLogs();
    const newLog = {
      tsIso: errorEntry.tsIso || new Date().toISOString(),
      route: errorEntry.route || window.location.pathname,
      code: errorEntry.code || 'UNKNOWN',
      messageShort: errorEntry.messageShort || 'No message',
      context: errorEntry.context || {},
    };
    
    logs.unshift(newLog); // Add to front
    
    // Keep only latest 20
    if (logs.length > MAX_ERROR_LOGS) {
      logs.length = MAX_ERROR_LOGS;
    }
    
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('[diagnostics] Failed to add error log:', err);
  }
}

/**
 * Get all error logs
 * @returns {array} - Array of error log entries
 */
export function getErrorLogs() {
  try {
    const stored = localStorage.getItem(ERROR_LOG_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (err) {
    console.error('[diagnostics] Failed to get error logs:', err);
    return [];
  }
}

/**
 * Clear all error logs
 */
export function clearErrorLogs() {
  try {
    localStorage.removeItem(ERROR_LOG_KEY);
  } catch (err) {
    console.error('[diagnostics] Failed to clear error logs:', err);
  }
}

/**
 * Get diagnostics snapshot (NO SENSITIVE DATA)
 * @param {object} options - { route, syncState, settingsSummary }
 * @returns {object} - Safe diagnostics data
 */
export async function getDiagnosticsSnapshot(options = {}) {
  const { route, syncState, settingsSummary } = options;

  // App info
  const appVersion = '1.1.0'; // Should match package.json
  const appMode = import.meta.env.MODE || 'production';
  
  // Device info (NO sensitive GPS data)
  const deviceInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    tzOffsetMinutes: new Date().getTimezoneOffset(),
  };

  // Runtime info
  const runtimeInfo = {
    nowIso: new Date().toISOString(),
    route: route || window.location.pathname,
    online: navigator.onLine,
    visibilityState: document.visibilityState,
  };

  // Sync state
  const syncInfo = {
    status: syncState?.syncStatus || 'unknown',
    lastSyncAtIso: syncState?.lastSyncAt || null,
    pendingOpsCount: syncState?.pendingOps || 0,
    failedOpsCount: syncState?.failedOps || 0,
    lastSyncError: syncState?.lastError ? classifyError(syncState.lastError) : null,
  };

  // DB counts (safe - no record payloads)
  const dbCounts = await getDbCounts();

  // Settings summary (NO tokens/email/GPS)
  const settings = {
    darkMode: settingsSummary?.darkMode ?? false,
    dailyTarget: settingsSummary?.dailyTarget ?? 0,
    defaultCommission: settingsSummary?.defaultCommission ?? 0,
    fuelEfficiency: settingsSummary?.fuelEfficiency ?? 0,
    maintenanceFee: settingsSummary?.maintenanceFee ?? 0,
    vehicleType: settingsSummary?.vehicleType ?? 'unknown',
  };

  // Error logs
  const errorLogs = getErrorLogs().slice(0, 20).map(log => ({
    tsIso: log.tsIso,
    route: log.route,
    code: log.code,
    messageShort: log.messageShort,
  }));

  // Hints based on error codes
  const hints = generateHints(errorLogs);

  return {
    app: {
      name: 'MAXIMUS PWA',
      version: appVersion,
      mode: appMode,
    },
    device: deviceInfo,
    runtime: runtimeInfo,
    sync: syncInfo,
    dbCounts,
    settings,
    errors: {
      recent: errorLogs,
    },
    hints,
  };
}

/**
 * Get IndexedDB counts safely (NO record dumps)
 * @returns {object} - { orders_cache, expenses_cache, oplog, failed_ops, heatmap_cache? }
 */
async function getDbCounts() {
  try {
    // Try to use localDb if available
    const { getDbStats } = await import('./localDb.js');
    const stats = await getDbStats();
    
    return {
      orders_cache: stats.ordersCount || 0,
      expenses_cache: stats.expensesCount || 0,
      oplog: stats.oplogCount || 0,
      failed_ops: stats.failedOpsCount || 0,
      heatmap_cache: stats.heatmapCount || 0,
    };
  } catch (err) {
    console.warn('[diagnostics] Could not get DB stats:', err);
    return {
      orders_cache: 0,
      expenses_cache: 0,
      oplog: 0,
      failed_ops: 0,
      heatmap_cache: 0,
    };
  }
}

/**
 * Generate hints based on error patterns
 * @param {array} errorLogs 
 * @returns {array} - Array of hint strings
 */
function generateHints(errorLogs) {
  const hints = [];
  const codes = errorLogs.map(log => log.code);

  if (codes.includes('RLS_DENIED')) {
    hints.push('⚠️ Ada masalah permission (RLS). Coba logout & login ulang, atau hubungi admin.');
  }

  if (codes.includes('SCHEMA_MISMATCH')) {
    hints.push('⚠️ Struktur database tidak cocok. Mungkin app perlu update atau migrasi belum jalan.');
  }

  if (codes.includes('NETWORK_OFFLINE')) {
    hints.push('ℹ️ Koneksi internet tidak stabil. App masih bekerja offline, sync otomatis nanti.');
  }

  if (codes.includes('RATE_LIMIT')) {
    hints.push('⏱️ Terlalu banyak request. Tunggu beberapa menit sebelum coba lagi.');
  }

  if (codes.includes('TIMEOUT')) {
    hints.push('⏱️ Server lambat atau koneksi lemah. Coba lagi nanti.');
  }

  if (hints.length === 0 && errorLogs.length > 0) {
    hints.push('ℹ️ Ada beberapa error. Lihat log detail di bawah.');
  }

  return hints;
}

/**
 * Build WhatsApp-friendly bug report message in Indonesian
 * @param {object} snapshot - Diagnostics snapshot from getDiagnosticsSnapshot
 * @returns {string} - Formatted message
 */
export function buildBugReportMessage(snapshot) {
  const route = snapshot.runtime?.route || 'unknown';
  const errorCode = snapshot.errors?.recent?.[0]?.code || 'N/A';
  const timestamp = snapshot.runtime?.nowIso || new Date().toISOString();
  const device = snapshot.device?.userAgent || 'unknown';

  // WhatsApp message template (Indonesian)
  let message = `🐛 LAPORAN BUG MAXIMUS

📅 Tanggal/Jam: ${new Date(timestamp).toLocaleString('id-ID')}
📱 HP/Android: ${device.substring(0, 80)}
📍 Halaman/Route: ${route}
⚠️ Kode error (jika ada): ${errorCode}

✏️ Langkah kejadian (singkat):
(Tulis di sini: apa yang Anda lakukan sebelum error?)

❌ Yang terjadi:
(Tulis di sini: apa yang error/salah?)

✅ Yang seharusnya:
(Tulis di sini: apa yang diharapkan?)

📷 Screenshot (jika ada):
(Kirim gambar terpisah jika perlu)

---
🔍 DIAGNOSTICS (JSON):
${JSON.stringify(snapshot, null, 2)}
`;

  // Safety: WhatsApp URL has length limit (~7000 chars safe)
  if (message.length > 7000) {
    // Shorten: keep summary, reduce JSON
    const shortSnapshot = {
      app: snapshot.app,
      runtime: snapshot.runtime,
      sync: {
        status: snapshot.sync?.status,
        pendingOpsCount: snapshot.sync?.pendingOpsCount,
        failedOpsCount: snapshot.sync?.failedOpsCount,
      },
      dbCounts: snapshot.dbCounts,
      settings: snapshot.settings,
      errors: {
        recent: snapshot.errors?.recent?.slice(0, 5), // Only 5 recent
      },
    };

    message = `🐛 LAPORAN BUG MAXIMUS

📅 Tanggal/Jam: ${new Date(timestamp).toLocaleString('id-ID')}
📱 HP/Android: ${device.substring(0, 80)}
📍 Halaman/Route: ${route}
⚠️ Kode error (jika ada): ${errorCode}

✏️ Langkah kejadian (singkat):
(Tulis di sini)

❌ Yang terjadi:
(Tulis di sini)

✅ Yang seharusnya:
(Tulis di sini)

---
🔍 DIAGNOSTICS (ringkas):
${JSON.stringify(shortSnapshot, null, 2)}
`;
  }

  return message;
}

/**
 * Open WhatsApp with pre-filled bug report
 * @param {string} message - Message to send
 * @returns {boolean} - true if opened, false if failed
 */
export function openWhatsAppReport(message) {
  const adminNumber = '6285953937946';
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${adminNumber}?text=${encodedMessage}`;

  try {
    // Try window.open first
    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    // If popup blocked, fallback to location.href
    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      window.location.href = whatsappUrl;
    }
    
    return true;
  } catch (err) {
    console.error('[diagnostics] Failed to open WhatsApp:', err);
    
    // Final fallback
    try {
      window.location.href = whatsappUrl;
      return true;
    } catch (err2) {
      console.error('[diagnostics] All WhatsApp open methods failed:', err2);
      return false;
    }
  }
}
