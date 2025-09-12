import { OFFICE_URL } from './appUrls'

export interface OfficeWalletResponse {
  balance: number
  transactions: Array<any>
}

export async function fetchWalletFromOffice(token: string): Promise<OfficeWalletResponse> {
  const res = await fetch(`${OFFICE_URL}/api/wallets/my-wallet`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch wallet')
  const data = await res.json()
  return {
    balance: Number(data.wallet?.balance || 0),
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
  }
}


