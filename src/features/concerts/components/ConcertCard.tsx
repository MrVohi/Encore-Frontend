import type { Concert } from '@/types/concert'
import { parseWhen } from '../utils/date'

export default function ConcertCard({
  concert,
  artistName,
  onBuy,
  buying,
  buyError,
}: {
  concert: Concert
  artistName?: string
  onBuy?: (concertId: string) => void
  buying?: boolean
  buyError?: string | null
}) {
  const d = concert.when ? parseWhen(concert.when) : null
  const date = d ? d.toLocaleString() : 'Unknown'
  const rawStatus = String(concert.status || '')
  const statusLabel = rawStatus
    ? rawStatus.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
    : 'Unknown'
  const statusClass = (() => {
    const key = rawStatus.toLowerCase()
    if (key.includes('sold')) return 'bg-red-600 text-white'
    if (key.includes('cancel')) return 'bg-red-500/20 text-red-200'
    if (key.includes('postpon')) return 'bg-amber-500/20 text-amber-200'
    if (key.includes('sale') || key.includes('open')) return 'bg-[var(--encore-accent-warm)] text-white'
    return 'bg-secondary text-muted-foreground'
  })()

  return (
    <div className="bg-card text-card-foreground border-[3px] border-border rounded-xl p-3 [box-shadow:4px_4px_0_var(--border)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-extrabold">
            {concert.city} — {concert.country}
          </div>
          {artistName ? <div className="text-sm font-semibold text-foreground/80">{artistName}</div> : null}
          <div className="text-sm text-muted-foreground">{date}</div>
          <div className="text-sm text-muted-foreground">Capacity: {concert.capacity}</div>
        </div>
        <span className={`inline-flex shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {onBuy && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onBuy(concert.id)}
            disabled={buying}
            className={[
              "inline-flex items-center justify-center rounded-full border-[3px] border-border",
              "px-3 py-1 text-xs font-extrabold",
              "[box-shadow:2px_2px_0_var(--border)] transition-transform",
              buying ? "bg-secondary text-muted-foreground" : "bg-[var(--encore-accent-warm)] text-white hover:-translate-y-0.5",
            ].join(" ")}
          >
            {buying ? "Adding…" : "Add to cart"}
          </button>
        </div>
      )}

      {buyError ? <div className="mt-2 text-xs text-red-300">{buyError}</div> : null}
    </div>
  )
}
