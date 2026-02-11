import api from '@/lib/api'

export type ConcertForSale = {
  id: string
  artist_id: string
  when: string
  city: string
  country: string
  capacity: number
  status: string
  created_at: string
  lat: number
  lng: number
  title: string
  venue: string
  price_cents: number
  currency: string
}

export type CreateCheckoutSessionPayload = {
  concert_id: string
  quantity: number
}

export type CreateCheckoutSessionResponse = {
  url: string
  session_id?: string
}

export type TicketType = {
  id: string
  concert_id: string
  name: string
  price_cents: number
  currency: string
  quantity: number
  starts: string
  ends: string
}

export type UserTicket = {
  id: string
  concert_id: string
  artist: string
  when: string
  city: string
  country: string
  seat: string
  status: string
  issued_at: string
  used_at?: string | null
}

export type UserTicketsResponse = {
  active: UserTicket[]
  past: UserTicket[]
}

export async function listUpcomingConcerts(): Promise<ConcertForSale[]> {
  const res = await api.get('/concerts/upcoming')
  return res.data
}

export async function createCheckoutSession(
  payload: CreateCheckoutSessionPayload,
): Promise<CreateCheckoutSessionResponse> {
  const res = await api.post('/tickets/checkout', payload)
  return res.data
}

export async function listUserTickets(): Promise<UserTicketsResponse> {
  const res = await api.get('/tickets')
  return res.data
}

export async function listTicketTypes(concertId: string): Promise<TicketType[]> {
  const res = await api.get(`/concerts/${concertId}/ticket-types`)
  return res.data
}
