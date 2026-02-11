import api from '@/lib/api'

export type CartItem = {
  id: string
  concert_id: string
  ticket_type_id: string
  quantity: number
  price_cents: number
  currency: string
  title: string
  city: string
  country: string
  when: string
}

export type CartResponse = {
  items: CartItem[]
  total_cents: number
  currency: string
}

export type CartCheckoutResponse = {
  url: string
  session_id?: string
}

export async function getCart(): Promise<CartResponse> {
  const res = await api.get('/cart')
  return res.data
}

export async function addCartItem(payload: { ticket_type_id: string; quantity?: number }): Promise<CartItem> {
  const res = await api.post('/cart/items', payload)
  return res.data
}

export async function updateCartItem(id: string, payload: { quantity: number }): Promise<CartItem> {
  const res = await api.patch(`/cart/items/${id}`, payload)
  return res.data
}

export async function removeCartItem(id: string): Promise<void> {
  await api.delete(`/cart/items/${id}`)
}

export async function checkoutCart(): Promise<CartCheckoutResponse> {
  const res = await api.post('/cart/checkout')
  return res.data
}
