// Wallet and transaction related types

export interface Wallet {
  id: string
  user: string
  user_name: string
  wallet_type: string
  balance: string
  currency: string
  is_active: boolean
  is_frozen: boolean
  created_at: string
  updated_at: string
}

export interface WalletListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Wallet[]
}

export interface Transaction {
  id: string
  wallet: string
  wallet_owner: string
  transaction_type: "credit" | "debit"
  transaction_type_display: string
  category: string
  category_display: string
  amount: string
  balance_before: string
  balance_after: string
  order: string | null
  payment: string | null
  reference: string
  description: string
  metadata: Record<string, any>
  created_by: string
  created_at: string
}

