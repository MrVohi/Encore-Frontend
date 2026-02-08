import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '../integrations/auth-context'
import RegisterForm from '../components/auth/RegisterForm'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="pt-0 min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  if (user) {
    if (user.is_email_verified) {
      return <Navigate to="/" />
    }
    return <Navigate to="/verify-email" />
  }

  return <RegisterForm />
}
