export interface Setlist {
  id: number
  title_id: string
  title_jp: string
  slug: string
  image?: string | null
  created_at?: string
  updated_at?: string
}

export interface SetlistPayload {
  title_id: string
  title_jp: string
  image?: File | null
}
