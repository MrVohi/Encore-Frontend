import ConcertMap  from '@/features/concerts/components/ConcertMap'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/map')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <ConcertMap />
  </div>
}
