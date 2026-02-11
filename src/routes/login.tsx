import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '../integrations/auth-context'
import LoginForm from '../components/auth/LoginForm'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
  
function LoginPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="pt-0 min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" />
  }

  return <LoginForm />
}
