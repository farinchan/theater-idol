export interface User {
  id: number
  name: string
  email: string
  phone?: string | null
  photo?: string | null
  role: 'admin' | 'user'
  is_active: boolean
  is_2fa_enabled: boolean
  membership_expires_at?: string | null
  is_member: boolean
  created_at?: string
  updated_at?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  phone?: string
  password: string
}

export interface GoogleLoginPayload {
  credential?: string
  id_token?: string
  access_token?: string
}

export interface Verify2FAPayload {
  pre_auth_token: string
  code: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface VerifyResetTokenPayload {
  email: string
  token: string
}

export interface ResetPasswordPayload {
  email: string
  token: string
  password: string
  confirm_password: string
}

export interface AuthResponseData {
  token?: string
  token_type?: string
  expires_in?: number
  two_factor_required?: boolean
  pre_auth_token?: string
  user?: User
}
