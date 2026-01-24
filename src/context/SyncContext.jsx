/**
 * Sync Context
 * Provides sync state and controls to the entire app
 */

import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { 
  startAutoSync, 
  stopAutoSync,
  onSyncStateChange,
  syncNow,
} from '../lib/syncEngine';
import { 
  initLocalDb,
  getSyncStatus,
  getLastSyncAt,
  getOplogCount,
  getFailedOpsCount,
  clearAllLocalData,
} from '../lib/localDb';
import { importFromSupabase } from '../lib/offlineOps';
import { fetchOrdersAndExpenses, monthRangeLocal } from '../lib/db';
import { createLogger } from '../lib/logger';
import { classifyError, addErrorLog } from '../lib/diagnostics';

const logger = createLogger('SyncContext');

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  const { session } = useSettings();
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [pendingOps, setPendingOps] = useState(0);
  const [failedOps, setFailedOps] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [conflicts, setConflicts] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  // New state for manual sync observability
  const [lastError, setLastError] = useState(null);
  const [queueLength, setQueueLength] = useState(0);
  const isMountedRef = useRef(false);
  const syncInProgressRef = useRef(false);
  const importInProgressRef = useRef(false);
  const hasImportedRef = useRef(false);

  // Initialize IndexedDB
  useEffect(() => {
    isMountedRef.current = true;
    
    const init = async () => {
      try {
        logger.info('Initializing local database');
        await initLocalDb();
        
        if (isMountedRef.current) {
          setIsInitialized(true);
          logger.info('Local database initialized');
        }
      } catch (error) {
        logger.error('Failed to initialize local database', error);
      }
    };
    
    init();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update status from IndexedDB
  const updateStatus = useCallback(async () => {
    if (!isInitialized) return;
    
    try {
      const [status, lastSync, opCount, failedCount] = await Promise.all([
        getSyncStatus(),
        getLastSyncAt(),
        getOplogCount(),
        getFailedOpsCount(),
      ]);
      
      if (isMountedRef.current) {
        setSyncStatus(status);
        setLastSyncAt(lastSync);
        setPendingOps(opCount);
        setFailedOps(failedCount);
        setQueueLength(opCount); // Update queue length
      }
    } catch (error) {
      logger.error('Failed to update sync status', error);
    }
  }, [isInitialized]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      logger.info('Network online');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      logger.info('Network offline');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for sync state changes from syncEngine
  useEffect(() => {
    if (!isInitialized) return;
    
    const unsubscribe = onSyncStateChange((state) => {
      if (state.type === 'status') {
        if (isMountedRef.current) {
          setSyncStatus(state.status);
          if (state.lastSync) {
            setLastSyncAt(state.lastSync);
          }
        }
      } else if (state.type === 'conflict') {
        logger.warn('Sync conflict detected', state);
        if (isMountedRef.current) {
          setConflicts(prev => [...prev, state]);
        }
        
        // Log conflict to diagnostics
        const classified = classifyError(state.error || { message: 'Sync conflict' });
        addErrorLog({
          route: window.location.pathname,
          code: classified.code,
          messageShort: classified.messageShort,
          context: { type: 'conflict', table: state.table, op: state.op },
        });
      } else if (state.type === 'operation_failed') {
        logger.error('Operation permanently failed', state);
        
        // Log failed operation to diagnostics
        const classified = classifyError(state.error || { message: 'Operation failed' });
        addErrorLog({
          route: window.location.pathname,
          code: classified.code,
          messageShort: classified.messageShort,
          context: { type: 'operation_failed', table: state.table, op: state.op },
        });
        
        // Update failed ops count
        updateStatus();
      }
    });
    
    return unsubscribe;
  }, [isInitialized, updateStatus]);

  // Start auto-sync when user is logged in
  useEffect(() => {
    if (!session?.user || !isInitialized) return;
    
    logger.info('Starting auto-sync for user', session.user.id);
    startAutoSync(session.user.id, { intervalMs: 60000 });
    
    // Update status immediately
    updateStatus();
    
    return () => {
      logger.info('Stopping auto-sync');
      stopAutoSync();
    };
  }, [session, isInitialized, updateStatus]);

  // Periodic status update
  useEffect(() => {
    if (!isInitialized) return;
    
    const interval = setInterval(() => {
      updateStatus();
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [isInitialized, updateStatus]);

  // Manual sync function
  const triggerSync = useCallback(async () => {
    if (!session?.user) {
      logger.warn('Cannot sync: no user session');
      const error = 'No user session';
      setLastError(error);
      return { success: false, error };
    }
    
    if (syncInProgressRef.current) {
      logger.warn('Sync already in progress');
      const error = 'Sync already in progress';
      setLastError(error);
      return { success: false, error };
    }
    
    syncInProgressRef.current = true;
    setLastError(null); // Clear previous error
    
    try {
      logger.info('Manual sync triggered via syncNow');
      const result = await syncNow({ reason: 'manual', userId: session.user.id });
      
      if (result.ok) {
        // Update state with successful sync
        if (isMountedRef.current) {
          setLastSyncAt(result.serverTime);
          setSyncStatus('idle');
          setLastError(null);
        }
        logger.info('Manual sync completed', result);
        return { success: true, ...result };
      } else {
        // Sync failed
        if (isMountedRef.current) {
          setLastError(result.error);
          setSyncStatus('error');
        }
        logger.error('Manual sync failed', result);
        return { success: false, error: result.error, ...result };
      }
    } catch (error) {
      const errorMsg = error.message || 'Unknown error';
      if (isMountedRef.current) {
        setLastError(errorMsg);
        setSyncStatus('error');
      }
      logger.error('Manual sync exception', error);
      return { success: false, error: errorMsg };
    } finally {
      syncInProgressRef.current = false;
      // Update queue length after sync
      await updateStatus();
    }
  }, [session, updateStatus]);

  // Initial data import
  const importInitialData = useCallback(async () => {
    if (!session?.user || !isInitialized) {
      logger.debug('Cannot import: no session or not initialized');
      return { success: false, reason: 'not_ready' };
    }
    
    // Prevent concurrent imports
    if (importInProgressRef.current) {
      logger.warn('Import already in progress, skipping');
      return { success: false, reason: 'in_progress' };
    }
    
    // Check if already imported
    if (hasImportedRef.current) {
      logger.debug('Data already imported, skipping');
      return { success: true, reason: 'already_imported' };
    }
    
    importInProgressRef.current = true;
    
    try {
      logger.info('Importing initial data from Supabase');
      const { startISO, endISO } = monthRangeLocal();
      const { orders, expenses } = await fetchOrdersAndExpenses(
        session.user.id,
        startISO,
        endISO
      );
      
      await importFromSupabase(orders, expenses);
      await updateStatus();
      
      hasImportedRef.current = true;
      logger.info('Initial data import completed', { 
        orders: orders.length, 
        expenses: expenses.length 
      });
      
      return { success: true, orders: orders.length, expenses: expenses.length };
    } catch (error) {
      logger.error('Failed to import initial data', error);
      return { success: false, error: error.message };
    } finally {
      importInProgressRef.current = false;
    }
  }, [session, isInitialized, updateStatus]);

  // Clear conflicts
  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  // Logout handler
  const handleLogout = useCallback(async () => {
    logger.info('Clearing local data on logout');
    await clearAllLocalData();
    setSyncStatus('idle');
    setLastSyncAt(null);
    setPendingOps(0);
    setFailedOps(0);
    setConflicts([]);
    setQueueLength(0);
    setLastError(null);
    hasImportedRef.current = false;
    importInProgressRef.current = false;
  }, []);

  // Force reimport data (untuk debugging atau refresh manual)
  const forceReimport = useCallback(async () => {
    logger.info('Forcing data reimport');
    hasImportedRef.current = false;
    return await importInitialData();
  }, [importInitialData]);

  const value = {
    // State
    syncStatus,
    lastSyncAt,
    pendingOps,
    failedOps,
    isOnline,
    conflicts,
    isInitialized,
    queueLength,
    lastError,
    
    // Actions
    triggerSync,
    importInitialData,
    forceReimport,
    clearConflicts,
    handleLogout,
    updateStatus,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};
