import { useEffect, useMemo, useState } from 'react'
import { checkoutCart, getCart, removeCartItem, updateCartItem, type CartItem } from '@/services/cart'

type CartDrawerProps = {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [totalCents, setTotalCents] = useState(0)
  const [currency, setCurrency] = useState('EUR')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'EUR',
      }),
    [currency],
  )

  const loadCart = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCart()
      setItems(Array.isArray(data.items) ? data.items : [])
      setTotalCents(Number(data.total_cents) || 0)
      setCurrency(data.currency || 'EUR')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load cart')
      setItems([])
      setTotalCents(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    loadCart()
  }, [open])

  const emitCartChanged = () => {
    window.dispatchEvent(new Event('cart:changed'))
  }

  const handleQtyChange = async (item: CartItem, nextQty: number) => {
    if (nextQty < 1) return
    setBusyId(item.id)
    try {
      const updated = await updateCartItem(item.id, { quantity: nextQty })
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
      setTotalCents((prev) => prev + (updated.quantity - item.quantity) * updated.price_cents)
      emitCartChanged()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (item: CartItem) => {
    setBusyId(item.id)
    try {
      await removeCartItem(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      setTotalCents((prev) => prev - item.price_cents * item.quantity)
      emitCartChanged()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
    } finally {
      setBusyId(null)
    }
  }

  const handleCheckout = async () => {
    setCheckoutBusy(true)
    setError(null)
    try {
      const { url } = await checkoutCart()
      if (!url) throw new Error('Checkout URL missing')
      window.location.assign(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setCheckoutBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/50">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close cart"
      />
      <aside className="relative z-10 h-full w-[min(92vw,420px)] bg-card text-foreground border-l-[3px] border-border shadow-2xl p-5 flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Cart</p>
            <h2 className="text-lg font-semibold">Your tickets</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:bg-secondary"
          >
            Close
          </button>
        </div>

        {loading && <p className="mt-4 text-sm text-muted-foreground">Loading cart…</p>}
        {error && <p className="mt-4 text-sm text-red-300">Error: {error}</p>}

        {!loading && !error && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-3">
            {items.length ? (
              items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border-[3px] border-border bg-secondary px-4 py-3 [box-shadow:3px_3px_0_var(--border)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.when).toLocaleString('en-US')} · {item.city}, {item.country}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatter.format(item.price_cents / 100)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border-[3px] border-border bg-card px-2 py-1 text-xs">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item, item.quantity - 1)}
                        disabled={busyId === item.id || item.quantity <= 1}
                        className="px-2 text-sm font-bold disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="min-w-[18px] text-center text-xs font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item, item.quantity + 1)}
                        disabled={busyId === item.id}
                        className="px-2 text-sm font-bold disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      disabled={busyId === item.id}
                      className="text-xs font-semibold text-red-300 hover:text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Your cart is empty.</div>
            )}
          </div>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total</span>
            <span>{formatter.format(totalCents / 100)}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkoutBusy || items.length === 0}
            className="mt-3 w-full rounded-md border-[3px] border-border bg-[var(--encore-accent-warm)] px-4 py-2 text-sm font-extrabold text-white [box-shadow:3px_3px_0_var(--border)] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
          >
            {checkoutBusy ? 'Redirecting…' : 'Checkout'}
          </button>
        </div>
      </aside>
    </div>
  )
}
