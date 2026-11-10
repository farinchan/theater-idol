export interface MembershipPlan {
  code: string
  name: string
  days: number
  price: number
  description: string
}

export interface MembershipTransactionUser {
  id: number
  name: string
  email: string
}

export interface MembershipTransaction {
  id: number
  user_id: number
  user?: MembershipTransactionUser
  order_id: string
  payment_id?: string | null
  plan_code: string
  days: number
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'expired'
  payment_method: string
  payment_link_url?: string | null
  expires_at?: string | null
  paid_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface MembershipStatus {
  is_member: boolean
  membership_expires_at?: string | null
  remaining_days: number
  remaining_hours: number
}

export interface CheckoutPayload {
  plan_code: string
}

export interface CheckoutResponseData {
  order_id: string
  plan_code: string
  plan_name: string
  days: number
  amount: number
  currency: string
  status: string
  payment_link_url: string
  expires_at?: string | null
  created_at?: string
}
