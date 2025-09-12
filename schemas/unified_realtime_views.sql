-- Real-time friendly views for Office queue, Customer dashboard, Collector workload

CREATE OR REPLACE VIEW public.v_office_approval_queue AS
SELECT c.id AS collection_id,
       c.user_id AS customer_id,
       u.full_name AS customer_name,
       c.status,
       c.created_at,
       c.updated_at,
       COALESCE(SUM(pi.quantity * COALESCE(pi.unit_price_applied, pi.unit_price)),0) AS total_amount,
       COALESCE(SUM(pi.quantity * COALESCE(pi.points_per_kg_applied, 0)),0) AS total_points
FROM public.collections c
LEFT JOIN public.users u ON u.id = c.user_id
LEFT JOIN public.pickup_items pi ON pi.pickup_id = c.id
WHERE c.status = 'pending'
GROUP BY c.id, c.user_id, u.full_name, c.status, c.created_at, c.updated_at;

CREATE OR REPLACE VIEW public.v_customer_dashboard AS
SELECT u.id AS user_id,
       u.full_name,
       w.balance,
       w.total_points,
       (SELECT jsonb_agg(jsonb_build_object(
                  'id', t.id,
                  'amount', t.amount,
                  'points', t.points,
                  'created_at', t.created_at,
                  'source_type', t.source_type
              ) ORDER BY t.created_at DESC)
        FROM public.wallet_transactions t
        WHERE t.user_id = u.id
        LIMIT 10) AS recent_wallet_activity,
       (SELECT jsonb_agg(jsonb_build_object(
                  'id', c.id,
                  'status', c.status,
                  'created_at', c.created_at,
                  'updated_at', c.updated_at
              ) ORDER BY c.created_at DESC)
        FROM public.collections c
        WHERE c.user_id = u.id
        LIMIT 5) AS recent_collections
FROM public.users u
LEFT JOIN public.wallets w ON w.user_id = u.id;

CREATE OR REPLACE VIEW public.v_collector_workload AS
SELECT c.collector_id,
       c.id AS collection_id,
       c.status,
       c.created_at,
       c.updated_at,
       u.full_name AS customer_name,
       COALESCE(SUM(pi.quantity),0) AS total_items
FROM public.collections c
LEFT JOIN public.users u ON u.id = c.user_id
LEFT JOIN public.pickup_items pi ON pi.pickup_id = c.id
GROUP BY c.collector_id, c.id, c.status, c.created_at, c.updated_at, u.full_name;


