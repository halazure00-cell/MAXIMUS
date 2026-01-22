-- ============================================================
-- 0008_security_hardening.sql
-- Fixes security lints regarding mutable search paths
-- ============================================================

begin;

-- Fix: function_search_path_mutable
-- Forces the function to execute explicitly in the 'public' schema context
-- ensuring malicious objects in other schemas cannot hijack execution.

ALTER FUNCTION public.set_updated_at() SET search_path = 'public';

commit;
