export interface SettingItem {
  key: string
  value: string
  description?: string
  updated_at?: string
}

export interface ShowSettings {
  show_enabled: boolean
  show_require_login: boolean
  show_require_membership: boolean
}

export interface StreamSettings {
  stream_enabled: boolean
  stream_require_login: boolean
  stream_require_membership: boolean
}

export interface UpdateShowSettingsPayload {
  show_enabled: boolean
  show_require_login: boolean
  show_require_membership: boolean
}

export interface UpdateStreamSettingsPayload {
  stream_enabled: boolean
  stream_require_login: boolean
  stream_require_membership: boolean
}
