export type SearchResult = {
  kind: 'artist' | 'album' | 'track' | string
  id: string
  label: string
  parent_id?: string
}
