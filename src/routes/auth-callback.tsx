import { createFileRoute } from '@tanstack/react-router'
import GoogleCallback from '../components/auth/google/callback'

export const Route = createFileRoute('/auth-callback')({
  component: GoogleCallback,
})
