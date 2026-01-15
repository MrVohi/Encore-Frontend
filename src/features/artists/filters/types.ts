export type ArtistOrder = 'created_at_desc' | 'created_at_asc' | 'name_asc' | 'name_desc'

export type ArtistFilters = {
    name: string
    genre: string | 'all'
    order: ArtistOrder
}

export const defaultArtistFilters: ArtistFilters = {
    name: '',
    genre: 'all',
    order: 'created_at_desc',
}
