import ConcertMap  from '@/features/concerts/components/ConcertMap'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/map')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div
      className="map-page no-top-pad w-full overflow-hidden bg-background relative"
      style={{ height: "100%" }}
    >
      <ConcertMap />
    </div>
  )
}
