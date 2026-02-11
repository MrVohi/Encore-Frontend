import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

export function getStripe() {
  if (!stripePromise) {
    const key = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '').trim()
    if (!key) {
      console.warn('Missing VITE_STRIPE_PUBLISHABLE_KEY')
      stripePromise = Promise.resolve(null)
    } else {
      stripePromise = loadStripe(key)
    }
  }
  return stripePromise
}
