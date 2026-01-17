# Changelog

All notable changes to MAXIMUS PWA will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-16

### Added - Offline-First Architecture

#### Database Foundation
- Added `client_tx_id` (UUID) column to orders and expenses tables for stable client-side identification
- Added `updated_at` (timestamptz) column for incremental sync tracking
- Added `deleted_at` (timestamptz) column for soft delete support
- Created unique constraint on `(user_id, client_tx_id)` for safe upserts
- Added performance indexes on `user_id + updated_at` and `user_id + deleted_at`
- Created triggers to automatically update `updated_at` on row modifications
- Updated RLS policies to support soft delete operations

#### Local Storage (IndexedDB)
- Integrated `idb` library for robust IndexedDB wrapper
- Created `orders_cache` store for local order storage
- Created `expenses_cache` store for local expense storage
- Created `oplog` store for operation queue (pending sync operations)
- Created `meta` store for sync metadata (device_id, last_sync_at, sync_status)
- Implemented cache operations (get, put, delete) with soft delete support

#### Offline Operations
- Implemented offline-first create for orders and expenses
- Implemented offline-first update with conflict detection
- Implemented soft delete (sets deleted_at timestamp)
- All mutations immediately update local cache for optimistic UI
- Operations queued in oplog for background synchronization

#### Sync Engine
- Bidirectional sync: Push (local → Supabase) and Pull (Supabase → local)
- FIFO operation queue processing from oplog
- Conflict detection based on updated_at timestamps
- Last-Write-Wins conflict resolution (server wins by default)
- Automatic sync on app start (if online)
- Automatic sync when device comes back online
- Optional periodic sync every 60 seconds when online
- Retry mechanism with exponential backoff (max 3 retries)
- Graceful error handling for auth and network issues

#### UI Integration
- Created SyncContext to provide sync state throughout the app
- Integrated SyncProvider in App.jsx
- Refactored ProfitEngine to use offline operations
- Refactored ExpenseModal to use offline operations
- Refactored Riwayat page to read from local cache
- Update and delete operations use client_tx_id
- Auto-refresh UI after mutations

#### Observability & UX
- Created standardized logger with environment-based verbosity
- Enhanced ErrorBoundary with error info copy button
- Added SyncStatusBanner component showing:
  - Online/offline status
  - Sync state (idle/syncing/error)
  - Pending operations count
  - Last sync timestamp
  - Manual "Sync Now" button
  - Conflict notifications
- Logger integration in all offline components

#### Developer Experience
- All offline operations properly typed and documented
- Comprehensive JSDoc comments
- Consistent error handling patterns
- Clean separation of concerns (db, ops, sync, UI)

### Changed
- Orders and expenses now use client_tx_id as primary identifier for offline operations
- Transactions read from IndexedDB cache instead of directly from Supabase
- Soft delete instead of hard delete for better sync safety
- All data mutations go through offline operation layer

### Technical Details
- Migration: `supabase/migrations/0004_offline_first.sql`
- Core Libraries: `src/lib/localDb.js`, `src/lib/offlineOps.js`, `src/lib/syncEngine.js`
- Logging: `src/lib/logger.js`
- Context: `src/context/SyncContext.jsx`
- UI Components: `src/components/SyncStatusBanner.jsx`

### Benefits
- App works 100% offline for data entry and viewing
- Zero data loss - all operations queued and retried
- Instant UI feedback with optimistic updates
- Automatic background sync when connection available
- Consistent data across devices after sync
- Better user experience on poor network conditions
- Resilient to temporary network failures

### Notes for Developers
- Database migration must be applied before deploying this version
- Existing data will work but won't have client_tx_id initially
- First sync after upgrade will generate client_tx_id for old records
- IndexedDB is automatically initialized on app load
- Clear browser storage to reset local cache if needed

## [1.0.0] - 2026-01-01

### Initial Release
- User authentication with Supabase
- Order profit calculator
- Expense tracking
- Transaction history
- Financial insights
- Strategic spots map
- PWA support
- Dark mode
