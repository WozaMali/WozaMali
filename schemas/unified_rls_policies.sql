-- RLS policies for new tables (assumes roles via JWT claim or profiles)

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Helper: simple role checks via current_setting('request.jwt.claims', true)
-- Adjust to your existing auth schema if you use a dedicated function.

CREATE POLICY wallet_tx_owner_select ON public.wallet_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY wallet_tx_office_read ON public.wallet_transactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('office','admin')
  ));

-- No direct INSERT/UPDATE/DELETE for wallet_transactions; only via RPC

CREATE POLICY mat_rates_office_read ON public.material_rates
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('office','admin','collector')
  ));

CREATE POLICY mat_rates_office_write ON public.material_rates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('office','admin')
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('office','admin')
  ));

CREATE POLICY approvals_office_read ON public.collection_approvals
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('office','admin')
  ));

CREATE POLICY approvals_office_write ON public.collection_approvals
  FOR INSERT USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('office','admin')
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('office','admin')
  ));

CREATE POLICY activity_read_related ON public.activity_log
  FOR SELECT USING (
    -- Allow office/admin full read
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('office','admin'))
    OR user_id = auth.uid()
  );


