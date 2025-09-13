-- ============================================================================
-- Safe performance indexes for hot tables/queries in the Main App
-- Run in Supabase SQL editor
-- ============================================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Collections
CREATE INDEX IF NOT EXISTS idx_collections_user_id_created ON public.collections(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_collector_id_created ON public.collections(collector_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_status_updated ON public.collections(status, updated_at DESC);

-- Wallets and transactions
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON public.wallet_transactions(user_id, created_at DESC);

-- Withdrawal requests
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_created ON public.withdrawal_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_created ON public.withdrawal_requests(status, created_at DESC);

-- Materials
CREATE INDEX IF NOT EXISTS idx_materials_is_active ON public.materials(is_active);
CREATE INDEX IF NOT EXISTS idx_materials_category_name ON public.materials(category, name);

-- Green Scholar
CREATE INDEX IF NOT EXISTS idx_gs_balance_last_updated ON public.green_scholar_fund_balance(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_gs_tx_created_by ON public.green_scholar_transactions(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gs_tx_type_created ON public.green_scholar_transactions(transaction_type, created_at DESC);


