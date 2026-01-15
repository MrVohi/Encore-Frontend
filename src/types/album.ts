export type Track = {
  id: string
  title: string
  track_no: number
  album_id: string
  created_at: string
}

export type Album = {
  id: string
  title: string
  release_date: string
  artist_id: string
  created_at: string
  tracks?: Track[]
}
