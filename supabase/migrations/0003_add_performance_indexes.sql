-- Migration: Add indexes for performance optimization
-- This improves query performance for date-range queries on orders and expenses tables
-- 
-- Usage: Run this migration in Supabase SQL Editor or via migration tool
-- 
-- These indexes optimize the common query pattern:
-- SELECT * FROM orders/expenses WHERE user_id = ? AND created_at >= ? AND created_at < ?

-- Index for orders: optimizes user + date range queries
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at 
ON public.orders (user_id, created_at DESC);

-- Index for expenses: optimizes user + date range queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_created_at 
ON public.expenses (user_id, created_at DESC);

-- Note: These indexes use descending order on created_at because
-- most queries sort by newest first (ORDER BY created_at DESC)
