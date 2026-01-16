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
    triggerSync,
    conflicts,
  } = useSyncContext();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await triggerSync();
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show banner if online and synced with no pending ops
  if (isOnline && syncStatus === 'idle' && pendingOps === 0 && conflicts.length === 0) {
    return null;
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff size={16} className="text-ui-warning" />;
    if (syncStatus === 'syncing' || isSyncing) return <RefreshCw size={16} className="text-ui-primary animate-spin" />;
    if (syncStatus === 'error') return <AlertCircle size={16} className="text-ui-danger" />;
    if (pendingOps > 0) return <Clock size={16} className="text-ui-info" />;
    return <CheckCircle size={16} className="text-ui-success" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus === 'syncing' || isSyncing) return 'Syncing...';
    if (syncStatus === 'error') return 'Sync Error';
    if (pendingOps > 0) return `${pendingOps} pending`;
    if (conflicts.length > 0) return `${conflicts.length} conflicts`;
    return 'Synced';
  };

  const getLastSyncText = () => {
    if (!lastSyncAt) return 'Never synced';
    try {
      return formatDistanceToNow(new Date(lastSyncAt), { 
        addSuffix: true,
        locale: id 
      });
    } catch {
      return 'Unknown';
    }
  };

  const getBgColor = () => {
    if (!isOnline) return 'bg-ui-warning/10 border-ui-warning/30';
    if (syncStatus === 'error') return 'bg-ui-danger/10 border-ui-danger/30';
    if (pendingOps > 0) return 'bg-ui-info/10 border-ui-info/30';
    return 'bg-ui-surface border-ui-border';
  };

  return (
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
        </div>
      </div>

      {isOnline && syncStatus !== 'syncing' && !isSyncing && (
        <button
          onClick={handleManualSync}
          className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-ui-primary text-ui-background rounded-ui-md hover:bg-ui-primary/90 press-effect"
        >
          <RefreshCw size={12} />
          Sync Now
        </button>
      )}
    </div>
  );
}
