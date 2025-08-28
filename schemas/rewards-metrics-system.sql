-- Rewards and Metrics System Schema for WozaMali
-- This schema handles cross-repository communication for wallets, points, rewards, donations, withdrawals, and metrics
-- Designed to work with external services and other repositories

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- External service connections for cross-repository communication
CREATE TABLE IF NOT EXISTS external_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL UNIQUE,
    service_type TEXT NOT NULL CHECK (service_type IN ('wallet', 'rewards', 'analytics', 'payment', 'notification')),
    base_url TEXT NOT NULL,
    api_key_hash TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys for external service authentication
CREATE TABLE IF NOT EXISTS service_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES external_services(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cross-repository sync queue for pending updates
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_service_id UUID NOT NULL REFERENCES external_services(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('wallet_update', 'points_update', 'reward_issue', 'donation_create', 'withdrawal_request', 'metrics_update')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('wallet', 'user', 'transaction', 'reward', 'donation', 'withdrawal', 'metric')),
    entity_id UUID NOT NULL,
    payload JSONB NOT NULL,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 10),
    retry_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- WALLET SYSTEM EXTENSIONS
-- ============================================================================

-- Enhanced wallet table with external sync capabilities
-- Drop and recreate table to ensure correct structure
DROP TABLE IF EXISTS enhanced_wallets CASCADE;

CREATE TABLE enhanced_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    external_wallet_id TEXT, -- ID from external wallet service
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on user_id (one wallet per user)
ALTER TABLE enhanced_wallets ADD CONSTRAINT enhanced_wallets_user_id_key UNIQUE (user_id);

-- Wallet sync history for audit trail
-- Drop and recreate table to ensure correct structure
DROP TABLE IF EXISTS wallet_sync_history CASCADE;

CREATE TABLE wallet_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('push', 'pull', 'full_sync')),
    external_service_id UUID NOT NULL REFERENCES external_services(id) ON DELETE CASCADE,
    old_balance DECIMAL(10,2),
    new_balance DECIMAL(10,2),
    old_points INTEGER,
    new_points INTEGER,
    sync_result TEXT NOT NULL CHECK (sync_result IN ('success', 'partial', 'failed')),
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to enhanced_wallets
ALTER TABLE wallet_sync_history ADD CONSTRAINT wallet_sync_history_wallet_id_fkey 
    FOREIGN KEY (wallet_id) REFERENCES enhanced_wallets(id) ON DELETE CASCADE;

-- ============================================================================
-- REWARDS SYSTEM
-- ============================================================================

-- Reward definitions that can be configured externally
-- Drop and recreate table to ensure correct structure
DROP TABLE IF EXISTS reward_definitions CASCADE;

CREATE TABLE reward_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    points_cost INTEGER DEFAULT 0,
    monetary_value DECIMAL(10,2) DEFAULT 0.00,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('discount', 'cashback', 'product', 'service', 'badge')),
    is_active BOOLEAN DEFAULT true,
    external_reward_id TEXT, -- ID from external rewards service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User rewards and redemptions
-- Drop and recreate table to ensure correct structure
DROP TABLE IF EXISTS user_rewards CASCADE;

CREATE TABLE user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reward_definition_id UUID NOT NULL REFERENCES reward_definitions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
    points_spent INTEGER DEFAULT 0,
    monetary_value DECIMAL(10,2) DEFAULT 0.00,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    external_reward_id TEXT, -- ID from external rewards service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- ============================================================================
-- DONATIONS SYSTEM
-- ============================================================================

-- Donation campaigns
-- Drop and recreate table to ensure correct structure
DROP TABLE IF EXISTS donation_campaigns CASCADE;

CREATE TABLE donation_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2),
    current_amount DECIMAL(10,2) DEFAULT 0.00,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    external_campaign_id TEXT, -- ID from external donation service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User donations
-- Drop and recreate table to ensure correct structure
DROP TABLE IF EXISTS user_donations CASCADE;

CREATE TABLE user_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    campaign_id UUID NOT NULL REFERENCES donation_campaigns(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    donation_type TEXT DEFAULT 'monetary' CHECK (donation_type IN ('monetary', 'points', 'mixed')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
    external_donation_id TEXT, -- ID from external donation service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- ============================================================================
-- WITHDRAWALS SYSTEM
-- ============================================================================

-- Withdrawal requests
-- Drop and recreate table to ensure correct structure
DROP TABLE IF EXISTS withdrawal_requests CASCADE;

CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    withdrawal_method TEXT NOT NULL CHECK (withdrawal_method IN ('bank_transfer', 'mobile_money', 'paypal', 'crypto')),
    account_details JSONB, -- Encrypted account information
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
    admin_notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    external_withdrawal_id TEXT, -- ID from external payment service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- ============================================================================
-- METRICS AND ANALYTICS
-- ============================================================================

-- User activity metrics
-- Drop and recreate table to ensure correct structure
DROP TABLE IF EXISTS user_metrics CASCADE;

CREATE TABLE user_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    metric_date DATE NOT NULL,
    total_recycling_kg DECIMAL(8,2) DEFAULT 0.00,
    total_points_earned INTEGER DEFAULT 0,
    total_points_spent INTEGER DEFAULT 0,
    total_donations DECIMAL(10,2) DEFAULT 0.00,
    total_withdrawals DECIMAL(10,2) DEFAULT 0.00,
    login_count INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE,
    external_metrics_id TEXT, -- ID from external analytics service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, metric_date)
);



-- System-wide metrics for external reporting
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('daily', 'weekly', 'monthly')),
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_recycling_kg DECIMAL(12,2) DEFAULT 0.00,
    total_points_issued INTEGER DEFAULT 0,
    total_points_redeemed INTEGER DEFAULT 0,
    total_donations DECIMAL(12,2) DEFAULT 0.00,
    total_withdrawals DECIMAL(12,2) DEFAULT 0.00,
    external_metrics_id TEXT, -- ID from external analytics service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_date, metric_type)
);

-- ============================================================================
-- PICKUP PHOTOS TABLE
-- ============================================================================

-- Table for storing pickup photos
-- Note: This table requires the core 'pickups' table to exist
-- If you get a foreign key error, ensure the main schema with 'pickups' table is created first

-- Drop and recreate table to ensure correct structure
DROP TABLE IF EXISTS pickup_photos CASCADE;

CREATE TABLE pickup_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_id UUID NOT NULL,
    photo_url TEXT NOT NULL,
    photo_type TEXT DEFAULT 'pickup' CHECK (photo_type IN ('pickup', 'before', 'after', 'damage')),
    file_size INTEGER, -- File size in bytes
    mime_type TEXT DEFAULT 'image/jpeg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint only if pickups table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickups') THEN
        ALTER TABLE pickup_photos ADD CONSTRAINT fk_pickup_photos_pickup_id 
            FOREIGN KEY (pickup_id) REFERENCES pickups(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- WEBHOOKS AND NOTIFICATIONS
-- ============================================================================

-- Webhook endpoints for external services
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES external_services(id) ON DELETE CASCADE,
    endpoint_url TEXT NOT NULL,
    events TEXT[] NOT NULL, -- Array of event types to listen for
    is_active BOOLEAN DEFAULT true,
    secret_key_hash TEXT, -- For webhook signature verification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook delivery history
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    delivery_time_ms INTEGER,
    success BOOLEAN DEFAULT false,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to add items to sync queue
CREATE OR REPLACE FUNCTION public.add_to_sync_queue(
    p_target_service_id UUID,
    p_operation_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_payload JSONB,
    p_priority INTEGER DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
    v_sync_id UUID;
BEGIN
    INSERT INTO sync_queue (
        target_service_id,
        operation_type,
        entity_type,
        entity_id,
        payload,
        priority
    ) VALUES (
        p_target_service_id,
        p_operation_type,
        p_entity_type,
        p_entity_id,
        p_payload,
        p_priority
    ) RETURNING id INTO v_sync_id;
    
    RETURN v_sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update wallet and queue sync
CREATE OR REPLACE FUNCTION public.update_wallet_with_sync(
    p_user_id UUID,
    p_balance_change DECIMAL(10,2),
    p_points_change INTEGER,
    p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_id UUID;
    v_sync_services UUID[];
    v_service_id UUID;
BEGIN
    -- Get wallet ID
    SELECT id INTO v_wallet_id FROM enhanced_wallets WHERE user_id = p_user_id;
    
    IF v_wallet_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update wallet
    UPDATE enhanced_wallets 
    SET 
        balance = balance + p_balance_change,
        total_points = total_points + p_points_change,
        updated_at = NOW(),
        sync_status = 'pending'
    WHERE id = v_wallet_id;
    
    -- Get active external wallet services
    SELECT array_agg(id) INTO v_sync_services 
    FROM external_services 
    WHERE service_type = 'wallet' AND is_active = true;
    
    -- Queue sync for each service
    FOREACH v_service_id IN ARRAY v_sync_services
    LOOP
        PERFORM public.add_to_sync_queue(
            v_service_id,
            'wallet_update',
            'wallet',
            v_wallet_id,
            jsonb_build_object(
                'user_id', p_user_id,
                'balance_change', p_balance_change,
                'points_change', p_points_change,
                'description', p_description
            ),
            1
        );
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process sync queue
CREATE OR REPLACE FUNCTION public.process_sync_queue()
RETURNS INTEGER AS $$
DECLARE
    v_processed_count INTEGER := 0;
    v_sync_item RECORD;
BEGIN
    -- Process pending items in priority order
    FOR v_sync_item IN 
        SELECT * FROM sync_queue 
        WHERE status = 'pending' 
        ORDER BY priority DESC, created_at ASC 
        LIMIT 10
    LOOP
        -- Update status to processing
        UPDATE sync_queue 
        SET status = 'processing', updated_at = NOW() 
        WHERE id = v_sync_item.id;
        
        -- Here you would implement the actual sync logic
        -- For now, we'll mark as completed
        UPDATE sync_queue 
        SET 
            status = 'completed', 
            processed_at = NOW(),
            updated_at = NOW() 
        WHERE id = v_sync_item.id;
        
        v_processed_count := v_processed_count + 1;
    END LOOP;
    
    RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TABLE CONSTRAINTS
-- ============================================================================

-- Add unique constraint on enhanced_wallets.user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'enhanced_wallets_user_id_key'
    ) THEN
        ALTER TABLE enhanced_wallets ADD CONSTRAINT enhanced_wallets_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE external_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enhanced_wallets
DROP POLICY IF EXISTS "Users can view own enhanced wallet" ON enhanced_wallets;
CREATE POLICY "Users can view own enhanced wallet" ON enhanced_wallets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enhanced wallet" ON enhanced_wallets;
CREATE POLICY "Users can update own enhanced wallet" ON enhanced_wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_rewards
DROP POLICY IF EXISTS "Users can view own rewards" ON user_rewards;
CREATE POLICY "Users can view own rewards" ON user_rewards
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own rewards" ON user_rewards;
CREATE POLICY "Users can insert own rewards" ON user_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_donations
DROP POLICY IF EXISTS "Users can view own donations" ON user_donations;
CREATE POLICY "Users can view own donations" ON user_donations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own donations" ON user_donations;
CREATE POLICY "Users can insert own donations" ON user_donations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for withdrawal_requests
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Users can insert own withdrawal requests" ON withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_metrics
DROP POLICY IF EXISTS "Users can view own metrics" ON user_metrics;
CREATE POLICY "Users can view own metrics" ON user_metrics
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for pickup_photos
-- Note: This policy requires the core 'pickups' table to exist
-- If you get an error, ensure the main schema with 'pickups' table is created first

-- Enable RLS on the table
ALTER TABLE pickup_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickups') THEN
        EXECUTE 'CREATE POLICY "Users can view own pickup photos" ON pickup_photos
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM pickups 
                    WHERE pickups.id = pickup_photos.pickup_id
                    AND pickups.customer_id = auth.uid()
                )
            )';
    END IF;
END $$;

-- Admin policies for system-wide tables
DROP POLICY IF EXISTS "Admins can manage external services" ON external_services;
CREATE POLICY "Admins can manage external services" ON external_services
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can manage sync queue" ON sync_queue;
CREATE POLICY "Admins can manage sync queue" ON sync_queue
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can manage system metrics" ON system_metrics;
CREATE POLICY "Admins can manage system metrics" ON system_metrics
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- External services indexes
CREATE INDEX IF NOT EXISTS idx_external_services_type ON external_services(service_type);
CREATE INDEX IF NOT EXISTS idx_external_services_active ON external_services(is_active);

-- Sync queue indexes
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_service ON sync_queue(target_service_id, status);

-- Enhanced wallet indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_wallets_user_id ON enhanced_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_wallets_sync_status ON enhanced_wallets(sync_status);

-- User rewards indexes
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);

-- Donation indexes
CREATE INDEX IF NOT EXISTS idx_user_donations_user_id ON user_donations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_donations_campaign_id ON user_donations(campaign_id);

-- Withdrawal indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Metrics indexes
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_date ON user_metrics(user_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_system_metrics_date_type ON system_metrics(metric_date, metric_type);

-- Pickup photos indexes
-- Create indexes for pickup_photos
CREATE INDEX idx_pickup_photos_pickup_id ON pickup_photos(pickup_id);
CREATE INDEX idx_pickup_photos_created_at ON pickup_photos(created_at);

-- Webhook indexes
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_success ON webhook_deliveries(success, created_at);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default external service types
INSERT INTO external_services (service_name, service_type, base_url, is_active) VALUES
('default-wallet-service', 'wallet', 'https://api.wallet-service.com', true),
('default-rewards-service', 'rewards', 'https://api.rewards-service.com', true),
('default-analytics-service', 'analytics', 'https://api.analytics-service.com', true),
('default-payment-service', 'payment', 'https://api.payment-service.com', true)
ON CONFLICT (service_name) DO NOTHING;

-- Insert default reward definitions with specific UUIDs for testing
INSERT INTO reward_definitions (id, reward_code, name, description, points_cost, reward_type) VALUES
('550e8400-e29b-41d4-a716-446655440089', 'CASHBACK_5', '5% Cashback', '5% cashback on next purchase', 100, 'cashback'),
('550e8400-e29b-41d4-a716-446655440090', 'DISCOUNT_10', '10% Discount', '10% discount on services', 200, 'discount'),
('550e8400-e29b-41d4-a716-446655440091', 'BRONZE_BADGE', 'Bronze Recycler', 'Earned for first 100 points', 0, 'badge'),
('550e8400-e29b-41d4-a716-446655440092', 'SILVER_BADGE', 'Silver Recycler', 'Earned for first 500 points', 0, 'badge'),
('550e8400-e29b-41d4-a716-446655440093', 'GOLD_BADGE', 'Gold Recycler', 'Earned for first 1000 points', 0, 'badge'),
('550e8400-e29b-41d4-a716-446655440094', 'PLATINUM_BADGE', 'Platinum Recycler', 'Earned for first 5000 points', 0, 'badge')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE external_services IS 'External services for cross-repository communication';
COMMENT ON TABLE sync_queue IS 'Queue for pending updates to external services';
COMMENT ON TABLE enhanced_wallets IS 'Enhanced wallets with external sync capabilities - one wallet per user (enforced by UNIQUE constraint on user_id)';
COMMENT ON TABLE pickup_photos IS 'Photos associated with pickup requests for verification and documentation';
COMMENT ON TABLE user_metrics IS 'Daily user activity metrics for analytics';
COMMENT ON TABLE system_metrics IS 'System-wide metrics for external reporting';
COMMENT ON TABLE webhook_endpoints IS 'Webhook endpoints for external service notifications';

COMMENT ON FUNCTION public.add_to_sync_queue IS 'Adds an item to the sync queue for external service updates';
COMMENT ON FUNCTION public.update_wallet_with_sync IS 'Updates wallet and queues sync with external services';
COMMENT ON FUNCTION public.process_sync_queue IS 'Processes pending sync queue items';

-- ============================================================================
-- FRONTEND REAL-TIME SCHEMA SETUP
-- ============================================================================
-- This schema enables real-time data collection for the customer dashboard
-- Run this in your Supabase SQL Editor to set up real-time subscriptions
--
-- IMPORTANT: This schema assumes the following core tables already exist:
-- - profiles (users table)
-- - pickups (pickup requests)
-- - pickup_items (items in pickups)
-- - addresses (user addresses)
-- - materials (recyclable materials)
--
-- If these tables don't exist, create them first or run this schema
-- after your main application schema.
--
-- PREREQUISITES: The following tables must exist before running this schema:
-- - profiles (with columns: id, full_name, email, phone, role)
-- - pickups (with columns: id, status, total_kg, total_value, created_at, approval_note, lat, lng, customer_id, collector_id, address_id)
-- - pickup_items (with columns: pickup_id, material_id, kilograms)
-- - addresses (with columns: id, line1, suburb, city, postal_code, profile_id)
-- - materials (with columns: id, rate_per_kg)
-- - pickup_photos (with columns: id, pickup_id, photo_url, photo_type, file_size, mime_type, created_at, updated_at)
--
-- These tables are typically defined in your main application schema.

-- ============================================================================
-- STEP 1: Enable Real-Time on All Tables
-- ============================================================================

-- Function to safely add table to real-time publication
CREATE OR REPLACE FUNCTION add_table_to_realtime(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = table_name
  ) THEN
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable real-time on tables safely
SELECT add_table_to_realtime('pickups');
SELECT add_table_to_realtime('pickup_items');
SELECT add_table_to_realtime('profiles');
SELECT add_table_to_realtime('addresses');
SELECT add_table_to_realtime('materials');
SELECT add_table_to_realtime('pickup_photos');

-- ============================================================================
-- STEP 2: Create Customer Dashboard Views
-- ============================================================================
-- NOTE: These views require the core tables (profiles, pickups, pickup_items, addresses, materials) to exist.
-- If you get errors when creating these views, ensure those core tables are created first.
-- The views will be created but may not work until the core tables are populated with data.

-- Create a comprehensive customer dashboard view
-- Note: This view requires the core tables (profiles, pickups, pickup_items, addresses, materials) to exist
-- These tables should be created in your main schema file before running this view
DROP VIEW IF EXISTS customer_dashboard_view;
CREATE VIEW customer_dashboard_view AS
SELECT 
  p.id as pickup_id,
  p.status,
  p.total_kg,
  p.total_value,
  p.created_at,
  p.approval_note,
  p.lat,
  p.lng,
  
  -- Customer info
  c.id as customer_id,
  c.full_name as customer_name,
  c.email as customer_email,
  c.phone as customer_phone,
  COALESCE(ew.balance, 0) + COALESCE(pickup_earnings.total_earnings, 0) - COALESCE(withdrawal_total.total_withdrawn, 0) as calculated_wallet_balance,
  
  -- Collector info
  col.id as collector_id,
  col.full_name as collector_name,
  col.email as collector_email,
  
  -- Address info
  a.line1,
  a.suburb,
  a.city,
  a.postal_code,
  
  -- Pickup items summary
  COALESCE(pi_summary.item_count, 0) as material_count,
  COALESCE(pi_summary.total_weight, 0) as calculated_weight,
  COALESCE(pi_summary.total_value, 0) as calculated_value,
  
  -- Environmental impact
  COALESCE(pi_summary.total_weight * 0.5, 0) as co2_saved_kg,
  COALESCE(pi_summary.total_weight * 0.1, 0) as water_saved_liters,
  COALESCE(pi_summary.total_weight * 0.3, 0) as landfill_saved_kg
  
FROM pickups p
LEFT JOIN profiles c ON p.customer_id = c.id
LEFT JOIN profiles col ON p.collector_id = col.id
LEFT JOIN addresses a ON p.address_id = a.id
LEFT JOIN enhanced_wallets ew ON c.id = ew.user_id
LEFT JOIN (
  SELECT 
    pickup_id,
    COUNT(*) as item_count,
    SUM(kilograms) as total_weight,
    SUM(kilograms * COALESCE(m.rate_per_kg, 0)) as total_value
  FROM pickup_items pi
  LEFT JOIN materials m ON pi.material_id = m.id
  GROUP BY pickup_id
) pi_summary ON p.id = pi_summary.pickup_id
LEFT JOIN (
  -- Calculate total earnings from approved pickups
  SELECT 
    customer_id,
    SUM(total_value) as total_earnings
  FROM pickups 
  WHERE status = 'approved'
  GROUP BY customer_id
) pickup_earnings ON c.id = pickup_earnings.customer_id
LEFT JOIN (
  -- Calculate total withdrawals
  SELECT 
    user_id,
    SUM(amount) as total_withdrawn
  FROM withdrawal_requests 
  WHERE status = 'approved'
  GROUP BY user_id
) withdrawal_total ON c.id = withdrawal_total.user_id;

-- ============================================================================
-- STEP 3: Create Customer Metrics View
-- ============================================================================

-- Create a comprehensive wallet balance view that matches back office calculations
DROP VIEW IF EXISTS customer_wallet_balance_view;
CREATE VIEW customer_wallet_balance_view AS
SELECT 
  c.id as customer_id,
  c.full_name,
  c.email,
  
  -- Base wallet balance from enhanced_wallets table
  COALESCE(ew.balance, 0) as base_balance,
  
  -- Earnings from approved pickups
  COALESCE(pickup_earnings.total_earnings, 0) as total_pickup_earnings,
  
  -- Withdrawals
  COALESCE(withdrawal_total.total_withdrawn, 0) as total_withdrawals,
  
  -- Donations made
  COALESCE(donation_total.total_donated, 0) as total_donations,
  
  -- Rewards redeemed
  COALESCE(rewards_total.total_redeemed, 0) as total_rewards_redeemed,
  
  -- Calculated current balance (matches back office logic)
  COALESCE(ew.balance, 0) + 
  COALESCE(pickup_earnings.total_earnings, 0) - 
  COALESCE(withdrawal_total.total_withdrawn, 0) - 
  COALESCE(donation_total.total_donated, 0) - 
  COALESCE(rewards_total.total_redeemed, 0) as calculated_current_balance,
  
  -- Last activity timestamps
  ew.updated_at as last_wallet_update,
  pickup_earnings.last_pickup_date,
  withdrawal_total.last_withdrawal_date,
  donation_total.last_donation_date,
  rewards_total.last_reward_date
  
FROM profiles c
LEFT JOIN enhanced_wallets ew ON c.id = ew.user_id
LEFT JOIN (
  -- Calculate total earnings from approved pickups
  SELECT 
    customer_id,
    SUM(total_value) as total_earnings,
    MAX(created_at) as last_pickup_date
  FROM pickups 
  WHERE status = 'approved'
  GROUP BY customer_id
) pickup_earnings ON c.id = pickup_earnings.customer_id
LEFT JOIN (
  -- Calculate total withdrawals
  SELECT 
    user_id,
    SUM(amount) as total_withdrawn,
    MAX(created_at) as last_withdrawal_date
  FROM withdrawal_requests 
  WHERE status = 'approved'
  GROUP BY user_id
) withdrawal_total ON c.id = withdrawal_total.user_id
LEFT JOIN (
  -- Calculate total donations
  SELECT 
    user_id,
    SUM(amount) as total_donated,
    MAX(created_at) as last_donation_date
  FROM user_donations 
  WHERE status = 'confirmed'
  GROUP BY user_id
) donation_total ON c.id = donation_total.user_id
LEFT JOIN (
  -- Calculate total rewards redeemed
  SELECT 
    user_id,
    SUM(monetary_value) as total_redeemed,
    MAX(redeemed_at) as last_reward_date
  FROM user_rewards 
  WHERE status = 'redeemed' AND monetary_value > 0
  GROUP BY user_id
) rewards_total ON c.id = rewards_total.user_id
WHERE c.role = 'customer';

DROP VIEW IF EXISTS customer_metrics_view;
CREATE VIEW customer_metrics_view AS
SELECT 
  c.id as customer_id,
  c.full_name,
  c.email,
  COALESCE(ew.balance, 0) + COALESCE(pickup_earnings.total_earnings, 0) - COALESCE(withdrawal_total.total_withdrawn, 0) as calculated_wallet_balance,
  
  -- Pickup statistics
  COUNT(p.id) as total_pickups,
  COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_pickups,
  COUNT(CASE WHEN p.status = 'submitted' THEN 1 END) as pending_pickups,
  COUNT(CASE WHEN p.status = 'rejected' THEN 1 END) as rejected_pickups,
  
  -- Weight and value totals
  COALESCE(SUM(p.total_kg), 0) as total_weight_kg,
  COALESCE(SUM(p.total_value), 0) as total_earnings,
  
  -- Environmental impact
  COALESCE(SUM(p.total_kg) * 0.5, 0) as total_co2_saved,
  COALESCE(SUM(p.total_kg) * 0.1, 0) as total_water_saved,
  COALESCE(SUM(p.total_kg) * 0.3, 0) as total_landfill_saved,
  
  -- Recent activity
  MAX(p.created_at) as last_pickup_date,
  MIN(p.created_at) as first_pickup_date
  
FROM profiles c
LEFT JOIN enhanced_wallets ew ON c.id = ew.user_id
LEFT JOIN (
  -- Calculate total earnings from approved pickups
  SELECT 
    customer_id,
    SUM(total_value) as total_earnings
  FROM pickups 
  WHERE status = 'approved'
  GROUP BY customer_id
) pickup_earnings ON c.id = pickup_earnings.customer_id
LEFT JOIN (
  -- Calculate total withdrawals
  SELECT 
    user_id,
    SUM(amount) as total_withdrawn
  FROM withdrawal_requests 
  WHERE status = 'approved'
  GROUP BY user_id
) withdrawal_total ON c.id = withdrawal_total.user_id
LEFT JOIN pickups p ON c.id = p.customer_id
WHERE c.role = 'customer'
GROUP BY c.id, c.full_name, c.email, ew.balance, pickup_earnings.total_earnings, withdrawal_total.total_withdrawn;

-- ============================================================================
-- STEP 4: Create Real-Time Subscription Functions
-- ============================================================================

-- Function to get customer's real-time pickup updates
CREATE OR REPLACE FUNCTION get_customer_pickup_updates(customer_uuid UUID)
RETURNS TABLE (
  pickup_id UUID,
  status TEXT,
  total_kg DECIMAL,
  total_value DECIMAL,
  updated_at TIMESTAMPTZ,
  change_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.status,
    p.total_kg,
    p.total_value,
    p.updated_at,
    'UPDATE'::TEXT
  FROM pickups p
  WHERE p.customer_id = customer_uuid
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get customer's wallet updates
CREATE OR REPLACE FUNCTION get_customer_wallet_updates(customer_uuid UUID)
RETURNS TABLE (
  customer_id UUID,
  wallet_balance DECIMAL,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.wallet_balance,
    p.updated_at
  FROM profiles p
  WHERE p.id = customer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Create RLS Policies for Customer Access
-- ============================================================================

-- Allow customers to read their own dashboard data
DROP POLICY IF EXISTS "Customers can view own dashboard" ON pickups;
CREATE POLICY "Customers can view own dashboard" ON pickups
FOR SELECT USING (
  customer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow customers to read their own pickup items
DROP POLICY IF EXISTS "Customers can view own pickup items" ON pickup_items;
CREATE POLICY "Customers can view own pickup items" ON pickup_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pickups 
    WHERE pickups.id = pickup_items.pickup_id
    AND pickups.customer_id = auth.uid()
  )
);

-- Allow customers to read their own profile (wallet info)
DROP POLICY IF EXISTS "Customers can view own profile" ON profiles;
CREATE POLICY "Customers can view own profile" ON profiles
FOR SELECT USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow customers to read addresses they own
DROP POLICY IF EXISTS "Customers can view own addresses" ON addresses;
CREATE POLICY "Customers can view own addresses" ON addresses
FOR SELECT USING (
  profile_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- STEP 6: Create Indexes for Performance
-- ============================================================================

-- Index for customer dashboard queries
CREATE INDEX IF NOT EXISTS idx_pickups_customer_status 
ON pickups(customer_id, status, created_at);

-- Index for pickup items by pickup
CREATE INDEX IF NOT EXISTS idx_pickup_items_pickup_material 
ON pickup_items(pickup_id, material_id);

-- Index for profiles by role
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role, id);

-- Index for addresses by profile
CREATE INDEX IF NOT EXISTS idx_addresses_profile 
ON addresses(profile_id);

-- ============================================================================
-- STEP 7: Create Materialized View for Fast Analytics
-- ============================================================================

-- Create a materialized view for customer performance metrics
DROP MATERIALIZED VIEW IF EXISTS customer_performance_summary;
CREATE MATERIALIZED VIEW customer_performance_summary AS
SELECT 
  c.id as customer_id,
  c.full_name,
  c.email,
  COALESCE(ew.balance, 0) + COALESCE(pickup_earnings.total_earnings, 0) - COALESCE(withdrawal_total.total_withdrawn, 0) as calculated_wallet_balance,
  
  -- Monthly statistics
  DATE_TRUNC('month', p.created_at) as month,
  COUNT(p.id) as monthly_pickups,
  COALESCE(SUM(p.total_kg), 0) as monthly_weight,
  COALESCE(SUM(p.total_value), 0) as monthly_earnings,
  
  -- Environmental impact
  COALESCE(SUM(p.total_kg) * 0.5, 0) as monthly_co2_saved,
  COALESCE(SUM(p.total_kg) * 0.1, 0) as monthly_water_saved,
  COALESCE(SUM(p.total_kg) * 0.3, 0) as monthly_landfill_saved
  
FROM profiles c
LEFT JOIN enhanced_wallets ew ON c.id = ew.user_id
LEFT JOIN (
  -- Calculate total earnings from approved pickups
  SELECT 
    customer_id,
    SUM(total_value) as total_earnings
  FROM pickups 
    WHERE status = 'approved'
  GROUP BY customer_id
) pickup_earnings ON c.id = pickup_earnings.customer_id
LEFT JOIN (
  -- Calculate total withdrawals
  SELECT 
    user_id,
    SUM(amount) as total_withdrawn
  FROM withdrawal_requests 
  WHERE status = 'approved'
  GROUP BY user_id
) withdrawal_total ON c.id = withdrawal_total.user_id
LEFT JOIN pickups p ON c.id = p.customer_id
WHERE c.role = 'customer'
GROUP BY c.id, c.full_name, c.email, ew.balance, pickup_earnings.total_earnings, withdrawal_total.total_withdrawn, DATE_TRUNC('month', p.created_at);

-- Create index on materialized view
CREATE INDEX idx_customer_performance_customer_month 
ON customer_performance_summary(customer_id, month);

-- ============================================================================
-- STEP 8: Create Refresh Function for Materialized View
-- ============================================================================

-- Function to sync wallet balances with calculated values
CREATE OR REPLACE FUNCTION sync_wallet_balances()
RETURNS VOID AS $$
DECLARE
  customer_record RECORD;
  calculated_balance DECIMAL(10,2);
BEGIN
  -- Loop through all customer profiles that exist in auth.users
  FOR customer_record IN 
    SELECT c.id, c.full_name
    FROM profiles c 
    WHERE c.role = 'customer'
    AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = c.id
    )
  LOOP
    -- Calculate the current balance based on all transactions
    SELECT 
      COALESCE(ew.balance, 0) + 
      COALESCE(pickup_earnings.total_earnings, 0) - 
      COALESCE(withdrawal_total.total_withdrawn, 0) - 
      COALESCE(donation_total.total_donated, 0) - 
      COALESCE(rewards_total.total_redeemed, 0)
    INTO calculated_balance
    FROM profiles c
    LEFT JOIN enhanced_wallets ew ON c.id = ew.user_id
    LEFT JOIN (
      SELECT customer_id, SUM(total_value) as total_earnings
      FROM pickups WHERE status = 'approved' GROUP BY customer_id
    ) pickup_earnings ON c.id = pickup_earnings.customer_id
    LEFT JOIN (
      SELECT user_id, SUM(amount) as total_withdrawn
      FROM withdrawal_requests WHERE status = 'approved' GROUP BY user_id
    ) withdrawal_total ON c.id = withdrawal_total.user_id
    LEFT JOIN (
      SELECT user_id, SUM(amount) as total_donated
      FROM user_donations WHERE status = 'confirmed' GROUP BY user_id
    ) donation_total ON c.id = donation_total.user_id
    LEFT JOIN (
      SELECT user_id, SUM(monetary_value) as total_redeemed
      FROM user_rewards WHERE status = 'redeemed' AND monetary_value > 0 GROUP BY user_id
    ) rewards_total ON c.id = rewards_total.user_id
    WHERE c.id = customer_record.id;
    
    -- Update or insert the wallet record
    -- First try to update existing record
    UPDATE enhanced_wallets 
    SET balance = calculated_balance, updated_at = NOW()
    WHERE user_id = customer_record.id;
    
    -- If no rows were updated, insert new record
    IF NOT FOUND THEN
      INSERT INTO enhanced_wallets (user_id, balance, updated_at)
      VALUES (customer_record.id, calculated_balance, NOW());
    END IF;
      
    RAISE NOTICE 'Synced wallet for %: %', customer_record.full_name, calculated_balance;
  END LOOP;
  
  RAISE NOTICE 'Wallet sync completed. Only synced wallets for users that exist in auth.users.';
END;
$$ LANGUAGE plpgsql;

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_customer_performance()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW customer_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 9: Create Trigger to Auto-Refresh Materialized View
-- ============================================================================

-- Function to refresh materialized view when data changes
CREATE OR REPLACE FUNCTION trigger_refresh_customer_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh the materialized view
  PERFORM refresh_customer_performance();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view when pickups change
DROP TRIGGER IF EXISTS trigger_refresh_customer_performance_pickups ON pickups;
CREATE TRIGGER trigger_refresh_customer_performance_pickups
  AFTER INSERT OR UPDATE OR DELETE ON pickups
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_customer_performance();

-- Create trigger to sync wallet balances when relevant data changes
CREATE OR REPLACE FUNCTION trigger_sync_wallet_balances()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync wallet balances when pickups, withdrawals, donations, or rewards change
  PERFORM sync_wallet_balances();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for wallet balance sync
DROP TRIGGER IF EXISTS trigger_sync_wallets_pickups ON pickups;
CREATE TRIGGER trigger_sync_wallets_pickups
  AFTER INSERT OR UPDATE OR DELETE ON pickups
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_wallet_balances();

DROP TRIGGER IF EXISTS trigger_sync_wallets_withdrawals ON withdrawal_requests;
CREATE TRIGGER trigger_sync_wallets_withdrawals
  AFTER INSERT OR UPDATE OR DELETE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_wallet_balances();

DROP TRIGGER IF EXISTS trigger_sync_wallets_donations ON user_donations;
CREATE TRIGGER trigger_sync_wallets_donations
  AFTER INSERT OR UPDATE OR DELETE ON user_donations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_wallet_balances();

DROP TRIGGER IF EXISTS trigger_sync_wallets_rewards ON user_rewards;
CREATE TRIGGER trigger_sync_wallets_rewards
  AFTER INSERT OR UPDATE OR DELETE ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_wallet_balances();

-- ============================================================================
-- STEP 10: Create Sample Data Queries for Testing
-- ============================================================================

-- Query to test customer dashboard view
-- Replace 'CUSTOMER_UUID_HERE' with actual customer UUID
/*
SELECT * FROM customer_dashboard_view 
WHERE customer_id = 'CUSTOMER_UUID_HERE'
ORDER BY created_at DESC;
*/

-- Query to test customer metrics view
-- Replace 'CUSTOMER_UUID_HERE' with actual customer UUID
/*
SELECT * FROM customer_metrics_view 
WHERE customer_id = 'CUSTOMER_UUID_HERE';
*/

-- Query to test customer performance summary
-- Replace 'CUSTOMER_UUID_HERE' with actual customer UUID
/*
SELECT * FROM customer_performance_summary 
WHERE customer_id = 'CUSTOMER_UUID_HERE'
ORDER BY month DESC;
*/

-- Query to test wallet balance view (matches back office calculations)
-- Replace 'CUSTOMER_UUID_HERE' with actual customer UUID
/*
SELECT * FROM customer_wallet_balance_view 
WHERE customer_id = 'CUSTOMER_UUID_HERE';
*/

-- Manual sync of all wallet balances (run this to sync with back office)
/*
SELECT sync_wallet_balances();
*/

-- ============================================================================
-- STEP 11: Verify Real-Time Setup
-- ============================================================================

-- Check which tables have real-time enabled
SELECT 
  pubname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('pickups', 'pickup_items', 'profiles', 'addresses')
ORDER BY tablename, policyname;

-- Check if views were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%customer%'
ORDER BY table_name;

-- ============================================================================
-- USAGE IN FRONTEND
-- ============================================================================
/*
In your frontend React component, use these real-time subscriptions:

1. Subscribe to pickup changes:
```typescript
const subscription = supabase
  .channel('customer_pickups_changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'pickups',
      filter: `customer_id=eq.${user.id}`
    }, 
    (payload) => {
      console.log('🔄 Pickup update received:', payload);
      // Refresh your dashboard data
      fetchCustomerDashboard();
    }
  )
  .subscribe();
```

2. Subscribe to profile changes (wallet updates):
```typescript
const walletSubscription = supabase
  .channel('customer_wallet_changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'profiles',
      filter: `id=eq.${user.id}`
    }, 
    (payload) => {
      console.log('💰 Wallet update received:', payload);
      // Update wallet balance display
      updateWalletBalance(payload.new.wallet_balance);
    }
  )
  .subscribe();
```

3. Subscribe to pickup items changes:
```typescript
const itemsSubscription = supabase
  .channel('customer_items_changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'pickup_items',
      filter: `pickup_id=in.(${userPickupIds.join(',')})`
    }, 
    (payload) => {
      console.log('📦 Pickup items update received:', payload);
      // Refresh pickup details
      fetchPickupDetails();
    }
  )
  .subscribe();
```

4. Use the views for efficient data fetching:
```typescript
// Get customer dashboard data
const { data: dashboardData } = await supabase
  .from('customer_dashboard_view')
  .select('*')
  .eq('customer_id', user.id)
  .order('created_at', { ascending: false });

// Get customer metrics
const { data: metricsData } = await supabase
  .from('customer_metrics_view')
  .select('*')
  .eq('customer_id', user.id)
  .single();

// Get performance summary
const { data: performanceData } = await supabase
  .from('customer_performance_summary')
  .select('*')
  .eq('customer_id', user.id)
  .order('month', { ascending: false });

// Get detailed wallet balance (matches back office calculations)
const { data: walletData } = await supabase
  .from('customer_wallet_balance_view')
  .select('*')
  .eq('customer_id', user.id)
  .single();
```
*/

-- ============================================================================
-- SUMMARY OF WHAT THIS SCHEMA PROVIDES
-- ============================================================================
/*
✅ Real-time subscriptions on all important tables
✅ Customer dashboard view with comprehensive data
✅ Customer metrics view for statistics
✅ Customer performance summary for analytics
✅ Proper RLS policies for security
✅ Performance indexes for fast queries
✅ Auto-refreshing materialized views
✅ Environmental impact calculations
✅ Wallet balance tracking
✅ Pickup history and status
✅ Material breakdown and pricing
✅ Address and location information

This schema will give your frontend real-time access to:
- Live pickup updates
- Instant wallet balance changes
- Real-time metrics updates
- Environmental impact calculations
- Performance analytics
- All customer-specific data
*/

-- ============================================================================
-- SAMPLE DATA CREATION FOR TESTING
-- ============================================================================
-- NOTE: This sample data uses test UUIDs that don't exist in auth.users.
-- Foreign key constraints to auth.users are made conditional to allow testing.
-- In production, replace these test UUIDs with actual user IDs from your auth system.
-- You can also comment out this section if you prefer to use your own data.
-- Run these scripts in Supabase SQL Editor to populate your database with realistic test data

-- ============================================================================
-- STEP 1: Create Sample Profiles (Customers and Collectors)
-- ============================================================================

-- Insert sample customer profiles
INSERT INTO profiles (id, full_name, email, phone, role, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john.doe@email.com', '+1234567890', 'customer', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane.smith@email.com', '+1234567891', 'customer', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Mike Johnson', 'mike.johnson@email.com', '+1234567892', 'customer', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Sarah Wilson', 'sarah.wilson@email.com', '+1234567893', 'customer', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'David Brown', 'david.brown@email.com', '+1234567894', 'customer', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample collector profiles
INSERT INTO profiles (id, full_name, email, phone, role, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440006', 'Alex Collector', 'alex.collector@wozamali.com', '+1234567895', 'collector', NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Maria Recycler', 'maria.recycler@wozamali.com', '+1234567896', 'collector', NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'Tom Green', 'tom.green@wozamali.com', '+1234567897', 'collector', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: Create Sample Addresses
-- ============================================================================

INSERT INTO addresses (id, profile_id, line1, suburb, city, postal_code, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', '123 Main Street', 'Downtown', 'Nairobi', '00100', NOW()),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', '456 Oak Avenue', 'Westlands', 'Nairobi', '00101', NOW()),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', '789 Pine Road', 'Kilimani', 'Nairobi', '00102', NOW()),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440004', '321 Elm Street', 'Lavington', 'Nairobi', '00103', NOW()),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440005', '654 Maple Drive', 'Karen', 'Nairobi', '00104', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Create Sample Materials
-- ============================================================================

INSERT INTO materials (id, name, description, rate_per_kg, category, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440021', 'Plastic Bottles', 'PET plastic bottles', 0.50, 'plastic', NOW()),
('550e8400-e29b-41d4-a716-446655440022', 'Aluminum Cans', 'Beverage cans', 1.20, 'metal', NOW()),
('550e8400-e29b-41d4-a716-446655440023', 'Mixed Paper', 'Mixed paper waste', 0.30, 'paper', NOW()),
('550e8400-e29b-41d4-a716-446655440024', 'Glass Bottles', 'Clear glass containers', 0.40, 'glass', NOW()),
('550e8400-e29b-41d4-a716-446655440025', 'Corrugated Cardboard', 'Corrugated cardboard boxes', 0.35, 'paper', NOW()),
('550e8400-e29b-41d4-a716-446655440026', 'Electronics', 'Small electronic waste', 2.00, 'e-waste', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 4: Create Sample Pickups
-- ============================================================================

INSERT INTO pickups (id, customer_id, collector_id, address_id, status, total_kg, total_value, approval_note, lat, lng, created_at, updated_at) VALUES
-- John Doe's pickups
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440011', 'approved', 15.5, 12.75, 'Great collection!', -1.2921, 36.8219, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440011', 'submitted', 8.2, 6.56, NULL, -1.2921, 36.8219, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- Jane Smith's pickups
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440012', 'approved', 22.0, 18.40, 'Excellent recycling effort!', -1.2841, 36.8155, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440012', 'approved', 12.8, 10.24, 'Good job!', -1.2841, 36.8155, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

-- Mike Johnson's pickups
('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440013', 'rejected', 5.5, 4.40, 'Materials not properly sorted', -1.2761, 36.8091, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- Sarah Wilson's pickups
('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440014', 'approved', 18.7, 15.61, 'Perfect sorting!', -1.2681, 36.8027, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- David Brown's pickups
('550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440015', 'submitted', 9.3, 7.44, NULL, -1.2601, 36.7963, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 5: Create Sample Pickup Items
-- ============================================================================

INSERT INTO pickup_items (id, pickup_id, material_id, kilograms, created_at) VALUES
-- John Doe's first pickup items
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', 8.0, NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440022', 4.5, NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440023', 3.0, NOW() - INTERVAL '7 days'),

-- John Doe's second pickup items
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440021', 5.2, NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440025', 3.0, NOW() - INTERVAL '2 days'),

-- Jane Smith's first pickup items
('550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440021', 10.0, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440022', 6.0, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440048', '550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440025', 6.0, NOW() - INTERVAL '5 days'),

-- Jane Smith's second pickup items
('550e8400-e29b-41d4-a716-446655440049', '550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440021', 7.0, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440023', 5.8, NOW() - INTERVAL '10 days'),

-- Mike Johnson's pickup items
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440021', 3.5, NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440024', 2.0, NOW() - INTERVAL '3 days'),

-- Sarah Wilson's pickup items
('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440021', 9.0, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440022', 5.0, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440055', '550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440025', 4.7, NOW() - INTERVAL '1 day'),

-- David Brown's pickup items
('550e8400-e29b-41d4-a716-446655440056', '550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440021', 6.0, NOW()),
('550e8400-e29b-41d4-a716-446655440057', '550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440023', 3.3, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 6: Create Sample Pickup Photos
-- ============================================================================

INSERT INTO pickup_photos (id, pickup_id, photo_url, photo_type, file_size, mime_type, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440031', 'https://example.com/photos/pickup_001_1.jpg', 'pickup', 1024000, 'image/jpeg', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440031', 'https://example.com/photos/pickup_001_2.jpg', 'pickup', 1536000, 'image/jpeg', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440033', 'https://example.com/photos/pickup_003_1.jpg', 'pickup', 2048000, 'image/jpeg', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440036', 'https://example.com/photos/pickup_006_1.jpg', 'pickup', 1792000, 'image/jpeg', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440065', '550e8400-e29b-41d4-a716-446655440037', 'https://example.com/photos/pickup_007_1.jpg', 'pickup', 1280000, 'image/jpeg', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 7: Create Sample Enhanced Wallets
-- ============================================================================

INSERT INTO enhanced_wallets (id, user_id, balance, total_points, tier, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440001', 25.31, 253, 'silver', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440002', 28.64, 286, 'silver', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440003', 0.00, 0, 'bronze', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440074', '550e8400-e29b-41d4-a716-446655440004', 15.61, 156, 'bronze', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440075', '550e8400-e29b-41d4-a716-446655440005', 0.00, 0, 'bronze', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 8: Create Sample Withdrawal Requests
-- ============================================================================

INSERT INTO withdrawal_requests (id, user_id, amount, withdrawal_method, status, admin_notes, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440001', 10.00, 'mobile_money', 'completed', 'Processed successfully', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440002', 15.00, 'bank_transfer', 'approved', 'Pending bank processing', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440004', 5.00, 'mobile_money', 'pending', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 9: Create Sample Donations
-- ============================================================================

INSERT INTO donation_campaigns (id, name, description, target_amount, current_amount, start_date, end_date, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440091', 'Tree Planting Initiative', 'Plant 1000 trees in Nairobi parks', 5000.00, 1250.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', true, NOW()),
('550e8400-e29b-41d4-a716-446655440092', 'Community Cleanup', 'Clean up 5 neighborhoods', 2000.00, 800.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_donations (id, user_id, campaign_id, amount, points_earned, status, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440093', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440091', 5.00, 50, 'confirmed', NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440094', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440091', 10.00, 100, 'confirmed', NOW() - INTERVAL '18 days'),
('550e8400-e29b-41d4-a716-446655440095', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440092', 3.00, 30, 'confirmed', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 10: Create Sample Rewards
-- ============================================================================

INSERT INTO user_rewards (id, user_id, reward_definition_id, status, points_spent, monetary_value, redeemed_at, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440089', 'redeemed', 100, 5.00, NOW() - INTERVAL '25 days', NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440089', 'redeemed', 200, 10.00, NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 11: Test the Real Data
-- ============================================================================

-- NOTE: These test queries require the core tables (profiles, pickups, addresses, materials) to exist.
-- If you get errors about missing columns or tables, ensure those core tables are created first.
-- You can uncomment these tests once the core application schema is in place.

/*
-- Test customer dashboard view
SELECT 'Testing customer dashboard view...' as test_step;
SELECT 
  customer_name,
  pickup_id,
  status,
  total_kg,
  total_value,
  calculated_wallet_balance
FROM customer_dashboard_view 
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY created_at DESC;

-- Test wallet balance view
SELECT 'Testing wallet balance view...' as test_step;
SELECT 
  customer_name,
  base_balance,
  total_pickup_earnings,
  total_withdrawals,
  total_donations,
  total_rewards_redeemed,
  calculated_current_balance
FROM customer_wallet_balance_view 
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';

-- Test customer metrics view
SELECT 'Testing customer metrics view...' as test_step;
SELECT 
  customer_name,
  total_pickups,
  approved_pickups,
  pending_pickups,
  rejected_pickups,
  total_weight_kg,
  total_earnings,
  calculated_wallet_balance
FROM customer_metrics_view 
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';
*/

-- ============================================================================
-- STEP 12: Verify Real-Time Setup
-- ============================================================================

-- Check which tables have real-time enabled
SELECT 'Checking real-time setup...' as test_step;
SELECT 
  pubname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Check if views were created
SELECT 'Checking views...' as test_step;
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%customer%'
ORDER BY table_name;

-- ============================================================================
-- STEP 13: Manual Wallet Balance Sync
-- ============================================================================

-- Sync all wallet balances with the new data
-- Note: This will only sync wallets for users that exist in auth.users
-- NOTE: This function requires the core tables to exist. Uncomment when ready.
/*
SELECT 'Syncing wallet balances...' as test_step;
SELECT sync_wallet_balances();
*/

-- ============================================================================
-- STEP 14: Alternative Testing Approach (Bypass Foreign Key for Testing)
-- ============================================================================

-- For testing purposes, you can temporarily disable the foreign key constraint
-- WARNING: Only use this in development/testing environments
/*
-- Temporarily disable foreign key constraint
ALTER TABLE enhanced_wallets DISABLE TRIGGER ALL;

-- Now you can insert test data without auth.users dependency
INSERT INTO enhanced_wallets (user_id, balance, total_points, tier, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 25.31, 253, 'silver', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 28.64, 286, 'silver', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 0.00, 0, 'bronze', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 15.61, 156, 'bronze', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 0.00, 0, 'bronze', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET 
  balance = EXCLUDED.balance,
  total_points = EXCLUDED.total_points,
  tier = EXCLUDED.tier,
  updated_at = NOW();

-- Re-enable foreign key constraint
ALTER TABLE enhanced_wallets ENABLE TRIGGER ALL;
*/

-- ============================================================================
-- SAMPLE DATA SUMMARY
-- ============================================================================
/*
✅ 5 Customer Profiles (John Doe, Jane Smith, Mike Johnson, Sarah Wilson, David Brown)
✅ 3 Collector Profiles (Alex, Maria, Tom)
✅ 5 Addresses (Nairobi locations)
✅ 6 Material Types (Plastic Bottles, Aluminum Cans, Mixed Paper, Glass Bottles, Corrugated Cardboard, Electronics)
✅ 7 Pickups (various statuses: approved, submitted, rejected)
✅ 17 Pickup Items (detailed material breakdown)
✅ 5 Pickup Photos
✅ 5 Enhanced Wallets (with realistic balances)
✅ 3 Withdrawal Requests (various statuses)
✅ 2 Donation Campaigns (Tree Planting, Community Cleanup)
✅ 3 User Donations
✅ 2 User Rewards (redeemed)

Total Test Data: 50+ records across all tables
Realistic Kenyan locations and recycling scenarios
Various pickup statuses for testing different workflows
*/

-- ============================================================================
-- QUICK TEST QUERIES
-- ============================================================================
-- Copy and paste these in Supabase SQL Editor for quick testing

/*
-- 1. See all customers and their current wallet balances
SELECT * FROM customer_wallet_balance_view;

-- 2. Check John Doe's pickup history
SELECT 
  customer_name,
  pickup_id,
  status,
  total_kg,
  total_value,
  calculated_wallet_balance
FROM customer_dashboard_view 
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY created_at DESC;

-- 3. View all pending pickups
SELECT * FROM customer_dashboard_view WHERE status = 'submitted';

-- 4. Check environmental impact for all customers
SELECT 
  customer_name,
  SUM(co2_saved_kg) as total_co2_saved,
  SUM(water_saved_liters) as total_water_saved,
  SUM(landfill_saved_kg) as total_landfill_saved
FROM customer_dashboard_view 
WHERE status = 'approved'
GROUP BY customer_name;

-- 5. Test real-time subscription (this will show live updates)
-- Subscribe to: pickups, pickup_items, profiles, enhanced_wallets
*/
