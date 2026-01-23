import { createFileRoute } from '@tanstack/react-router'
import VerifyEmail from '../components/auth/VerifyEmail'

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmail,
})
