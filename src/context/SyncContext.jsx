/**
 * Sync Context
 * Provides sync state and controls to the entire app
 */

import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { 
  syncAll, 
  startAutoSync, 
  stopAutoSync,
  onSyncStateChange,
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

const logger = createLogger('SyncContext');

const SyncContext = createContext();

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }) => {
  const { session } = useSettings();
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [pendingOps, setPendingOps] = useState(0);
  const [failedOps, setFailedOps] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [conflicts, setConflicts] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const isMountedRef = useRef(false);
  const syncInProgressRef = useRef(false);

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
      } else if (state.type === 'operation_failed') {
        logger.error('Operation permanently failed', state);
        // Update failed ops count
        updateStatus();
      }
    });
    
    return unsubscribe;
  }, [isInitialized]);

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
      return { success: false, error: 'No user session' };
    }
    
    if (syncInProgressRef.current) {
      logger.warn('Sync already in progress');
      return { success: false, error: 'Sync already in progress' };
    }
    
    syncInProgressRef.current = true;
    
    try {
      logger.info('Manual sync triggered');
      const result = await syncAll(session.user.id);
      await updateStatus();
      logger.info('Manual sync completed', result);
      return result;
    } catch (error) {
      logger.error('Manual sync failed', error);
      return { success: false, error: error.message };
    } finally {
      syncInProgressRef.current = false;
    }
  }, [session, updateStatus]);

  // Initial data import
  const importInitialData = useCallback(async () => {
    if (!session?.user || !isInitialized) return;
    
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
      logger.info('Initial data import completed', { 
        orders: orders.length, 
        expenses: expenses.length 
      });
    } catch (error) {
      logger.error('Failed to import initial data', error);
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
  }, []);

  const value = {
    // State
    syncStatus,
    lastSyncAt,
    pendingOps,
    failedOps,
    isOnline,
    conflicts,
    isInitialized,
    
    // Actions
    triggerSync,
    importInitialData,
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
