export interface UpdateProfilePayload {
  name?: string
  email?: string
  phone?: string
  is_2fa_enabled?: boolean
}

export interface Toggle2FAPayload {
  enable: boolean
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
  confirm_password: string
}
