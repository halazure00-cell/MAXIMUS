/**
 * Sync Debug Utilities
 * Utility functions for debugging sync issues
 * 
 * Usage in Console:
 * import { syncDebug } from './lib/syncDebug';
 * syncDebug.checkHealth();
 */

import { getDbStats, getPendingOps, getFailedOps } from './localDb';

/**
 * Check overall sync health
 */
export async function checkHealth() {
  try {
    const stats = await getDbStats();
    const pendingOps = await getPendingOps();
    const failedOps = await getFailedOps();
    
    console.group('🔍 Sync Health Check');
    console.log('📊 Database Stats:', stats);
    console.log('⏳ Pending Operations:', pendingOps.length);
    console.log('❌ Failed Operations:', failedOps.length);
    console.log('🌐 Online Status:', navigator.onLine);
    
    // Health score
    let score = 100;
    const issues = [];
    
    if (failedOps.length > 0) {
      score -= failedOps.length * 10;
      issues.push(`${failedOps.length} failed operations`);
    }
    
    if (pendingOps.length > 20) {
      score -= 20;
      issues.push(`${pendingOps.length} pending operations (high)`);
    }
    
    if (!stats.lastSync) {
      score -= 30;
      issues.push('Never synced');
    } else {
      const lastSyncTime = new Date(stats.lastSync).getTime();
      const now = Date.now();
      const minutesAgo = (now - lastSyncTime) / 1000 / 60;
      
      if (minutesAgo > 5 && navigator.onLine) {
        score -= 15;
        issues.push(`Last sync ${minutesAgo.toFixed(1)} minutes ago`);
      }
    }
    
    score = Math.max(0, score);
    
    console.log('');
    console.log('📈 Health Score:', `${score}/100`);
    
    if (issues.length > 0) {
      console.log('⚠️  Issues Found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ No issues found');
    }
    
    console.groupEnd();
    
    return { score, issues, stats, pendingOps, failedOps };
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return null;
  }
}

/**
 * Show detailed pending operations
 */
export async function showPendingOps() {
  try {
    const ops = await getPendingOps();
    
    console.group(`⏳ Pending Operations (${ops.length})`);
    
    if (ops.length === 0) {
      console.log('✅ No pending operations');
    } else {
      ops.forEach((op, idx) => {
        console.log(`\n${idx + 1}. ${op.op.toUpperCase()} ${op.table}`);
        console.log('   Client TX ID:', op.client_tx_id);
        console.log('   Created:', new Date(op.created_at).toLocaleString());
        console.log('   Retries:', op.retry_count || 0);
        if (op.last_error) {
          console.log('   Last Error:', op.last_error);
        }
      });
    }
    
    console.groupEnd();
    return ops;
  } catch (error) {
    console.error('❌ Failed to get pending ops:', error);
    return null;
  }
}

/**
 * Show detailed failed operations
 */
export async function showFailedOps() {
  try {
    const ops = await getFailedOps();
    
    console.group(`❌ Failed Operations (${ops.length})`);
    
    if (ops.length === 0) {
      console.log('✅ No failed operations');
    } else {
      ops.forEach((op, idx) => {
        console.log(`\n${idx + 1}. ${op.op.toUpperCase()} ${op.table}`);
        console.log('   Client TX ID:', op.client_tx_id);
        console.log('   Failed At:', new Date(op.failed_at).toLocaleString());
        console.log('   Retry Count:', op.retry_count || 0);
        console.log('   Last Error:', op.last_error || 'Unknown');
      });
    }
    
    console.groupEnd();
    return ops;
  } catch (error) {
    console.error('❌ Failed to get failed ops:', error);
    return null;
  }
}

/**
 * Export all sync data for debugging
 */
export async function exportSyncData() {
  try {
    const [stats, pendingOps, failedOps] = await Promise.all([
      getDbStats(),
      getPendingOps(),
      getFailedOps(),
    ]);
    
    const data = {
      timestamp: new Date().toISOString(),
      online: navigator.onLine,
      stats,
      pendingOps,
      failedOps,
      userAgent: navigator.userAgent,
    };
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ Sync data exported');
    return data;
  } catch (error) {
    console.error('❌ Failed to export sync data:', error);
    return null;
  }
}

/**
 * Clear all failed operations (use with caution)
 */
export async function clearFailedOperations() {
  try {
    const { clearFailedOps } = await import('./localDb');
    await clearFailedOps();
    console.log('✅ Failed operations cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear failed ops:', error);
    return false;
  }
}

/**
 * Monitor sync in real-time
 */
export function monitorSync(intervalMs = 5000) {
  let intervalId = null;
  
  const start = () => {
    if (intervalId) {
      console.warn('⚠️  Monitor already running');
      return;
    }
    
    console.log('🔍 Starting sync monitor (every 5s)');
    console.log('💡 Call syncDebug.monitor.stop() to stop monitoring\n');
    
    intervalId = setInterval(async () => {
      const stats = await getDbStats();
      const pending = await getPendingOps();
      const failed = await getFailedOps();
      
      const status = [
        `📊 ${new Date().toLocaleTimeString()}`,
        `Status: ${stats.syncStatus}`,
        `Orders: ${stats.ordersCount}`,
        `Expenses: ${stats.expensesCount}`,
        `Pending: ${pending.length}`,
        `Failed: ${failed.length}`,
        navigator.onLine ? '🌐 Online' : '📵 Offline',
      ].join(' | ');
      
      console.log(status);
    }, intervalMs);
  };
  
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      console.log('✅ Sync monitor stopped');
    }
  };
  
  return { start, stop };
}

// Create monitor instance
const monitor = monitorSync();

// Export all debug functions
export const syncDebug = {
  checkHealth,
  showPendingOps,
  showFailedOps,
  exportSyncData,
  clearFailedOperations,
  monitor,
};

// Make available globally for console access
if (typeof window !== 'undefined') {
  window.syncDebug = syncDebug;
  console.log('💡 Sync Debug Utils loaded. Use window.syncDebug in console.');
  console.log('   Example: syncDebug.checkHealth()');
}

export default syncDebug;
