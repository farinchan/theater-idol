import type { Setlist } from './setlist'

export interface ShowListItem {
  id: string
  setlist_id: number
  setlist?: Setlist
  date: string
  time: string
  description?: string
  lineup?: string
  created_at?: string
  updated_at?: string
}

export interface Show extends ShowListItem {
  replay_url?: string | null
}

export interface ShowPayload {
  setlist_id: number
  date: string
  time: string
  description?: string
  lineup?: string
  replay_url?: string
}
