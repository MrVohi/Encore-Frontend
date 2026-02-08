import type { Concert } from '@/types/concert'
import { parseWhen } from '../utils/date'

export default function ConcertCard({
  concert,
  artistName,
}: {
  concert: Concert
  artistName?: string
}) {
  const d = concert.when ? parseWhen(concert.when) : null
  const date = d ? d.toLocaleString() : 'Unknown'

  return (
    <div className="bg-card text-card-foreground border-[3px] border-border rounded-xl p-3 [box-shadow:4px_4px_0_var(--border)]">
      <div className="font-extrabold">
        {concert.city} — {concert.country}
      </div>
      {artistName ? <div className="text-sm font-semibold text-foreground/80">{artistName}</div> : null}
      <div className="text-sm text-muted-foreground">{date}</div>
      <div className="text-sm text-muted-foreground">Capacity: {concert.capacity}</div>
      <div className="text-sm text-muted-foreground">Status: {concert.status}</div>
    </div>
  )
}
