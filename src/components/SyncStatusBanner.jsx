/**
 * Sync Status Banner
 * Shows connection status and sync state with manual sync button
 */

import { useState } from 'react';
import { useSyncContext } from '../context/SyncContext';
import { WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export default function SyncStatusBanner() {
  const { 
    isOnline, 
    syncStatus, 
    lastSyncAt, 
    pendingOps,
    failedOps,
    triggerSync,
    conflicts,
    clearConflicts,
    queueLength,
    lastError,
  } = useSyncContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConflictDetails, setShowConflictDetails] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await triggerSync();
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show banner if online and synced with no pending ops, failed ops, conflicts, or errors
  if (isOnline && syncStatus === 'idle' && pendingOps === 0 && failedOps === 0 && conflicts.length === 0 && !lastError) {
    return null;
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff size={16} className="text-ui-warning" />;
    if (syncStatus === 'syncing' || isSyncing) return <RefreshCw size={16} className="text-ui-primary animate-spin" />;
    if (syncStatus === 'error' || lastError) return <AlertCircle size={16} className="text-ui-danger" />;
    if (pendingOps > 0) return <Clock size={16} className="text-ui-info" />;
    return <CheckCircle size={16} className="text-ui-success" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus === 'syncing' || isSyncing) return 'Syncing...';
    if (syncStatus === 'error' || lastError) return 'Sync Error';
    if (failedOps > 0) return `${failedOps} failed`;
    if (queueLength > 0) return `${queueLength} in queue`;
    if (conflicts.length > 0) return `${conflicts.length} conflicts`;
    return 'Synced';
  };

  const getLastSyncText = () => {
    if (!lastSyncAt) return 'Never synced';
    try {
      // Try with Indonesian locale, fallback to default if not available
      return formatDistanceToNow(new Date(lastSyncAt), { 
        addSuffix: true,
        locale: id 
      });
    } catch {
      // Fallback to default locale
      try {
        return formatDistanceToNow(new Date(lastSyncAt), { 
          addSuffix: true 
        });
      } catch {
        return 'Unknown';
      }
    }
  };

  const getBgColor = () => {
    if (!isOnline) return 'bg-ui-warning/10 border-ui-warning/30';
    if (syncStatus === 'error' || failedOps > 0 || lastError) return 'bg-ui-danger/10 border-ui-danger/30';
    if (pendingOps > 0 || queueLength > 0) return 'bg-ui-info/10 border-ui-info/30';
    if (conflicts.length > 0) return 'bg-ui-warning/10 border-ui-warning/30';
    return 'bg-ui-surface border-ui-border';
  };

  return (
    <>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${getBgColor()}`}>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-ui-text">{getStatusText()}</span>
            {lastSyncAt && (
              <span className="text-[10px] text-ui-muted">
                Last: {getLastSyncText()}
              </span>
            )}
            {queueLength > 0 && (
              <span className="text-[10px] text-ui-info">
                Queue: {queueLength} ops
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {conflicts.length > 0 && (
            <button
              onClick={() => setShowConflictDetails(!showConflictDetails)}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-ui-warning text-ui-background rounded-ui-md hover:bg-ui-warning/90 press-effect"
            >
              <AlertCircle size={12} />
              {showConflictDetails ? 'Hide' : 'Details'}
            </button>
          )}
          
          <button
            onClick={handleManualSync}
            disabled={!isOnline || syncStatus === 'syncing' || isSyncing}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-ui-primary text-ui-background rounded-ui-md hover:bg-ui-primary/90 press-effect disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={12} />
            Sync sekarang
          </button>
        </div>
      </div>

      {/* Error display */}
      {lastError && (
        <div className="bg-ui-danger/10 border-b border-ui-danger/30 px-4 py-2">
          <p className="text-xs text-ui-danger font-semibold">
            ❌ Sync Error
          </p>
          <p className="text-[10px] text-ui-muted mt-1">
            {lastError}
          </p>
        </div>
      )}

      {/* Conflict details */}
      {showConflictDetails && conflicts.length > 0 && (
        <div className="bg-ui-warning/5 border-b border-ui-warning/30 px-4 py-3">
          <p className="text-xs text-ui-text font-semibold mb-2">
            ⚠️ Data Conflicts ({conflicts.length})
          </p>
          <p className="text-[10px] text-ui-muted mb-2">
            Perubahan Anda bentrok dengan update dari device lain. Data dari server diterapkan (server-wins).
          </p>
          {conflicts.slice(0, 3).map((conflict, idx) => (
            <div key={idx} className="text-[10px] text-ui-muted bg-ui-surface/50 p-2 rounded mb-1">
              <strong>{conflict.table}</strong> - {conflict.clientTxId?.substring(0, 8)}
            </div>
          ))}
          {conflicts.length > 3 && (
            <p className="text-[9px] text-ui-muted italic">
              ... dan {conflicts.length - 3} konflik lainnya
            </p>
          )}
          <button
            onClick={clearConflicts}
            className="mt-2 text-[10px] text-ui-primary underline hover:no-underline"
          >
            Tutup pemberitahuan ini
          </button>
        </div>
      )}

      {/* Failed operations warning */}
      {failedOps > 0 && (
        <div className="bg-ui-danger/10 border-b border-ui-danger/30 px-4 py-2">
          <p className="text-xs text-ui-danger font-semibold">
            ⚠️ {failedOps} operasi gagal setelah 3x percobaan
          </p>
          <p className="text-[10px] text-ui-muted mt-1">
            Periksa koneksi internet atau login ulang jika masalah berlanjut.
          </p>
        </div>
      )}
    </>
  );
}
