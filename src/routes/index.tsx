import { createFileRoute } from '@tanstack/react-router'
import ArtistsPage from '@/features/artists/pages/ArtistsPage'

export const Route = createFileRoute('/')({
  component: ArtistsPage,
})
