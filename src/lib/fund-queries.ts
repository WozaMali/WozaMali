import { supabase } from '@/lib/supabase'

export type CustomerFundActivityItem = {
  id: string
  amount: number
  created_at: string
  source_type: string
}

export type CustomerFundRow = {
  user_id: string
  full_name: string | null
  total_contributed: number
  recent_fund_activity: CustomerFundActivityItem[] | null
}

export async function getCustomerFund(userId: string): Promise<CustomerFundRow | null> {
  const { data, error } = await supabase
    .from('v_customer_fund')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // Surface null to let caller decide UI fallback
    return null
  }

  return (data as unknown) as CustomerFundRow
}

export async function getFundTotal(): Promise<number> {
  const { data, error } = await supabase
    .from('v_fund_total')
    .select('fund_total')
    .single()

  if (error || !data) {
    return 0
  }

  return Number(data.fund_total || 0)
}


