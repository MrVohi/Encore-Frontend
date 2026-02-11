import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/tickets-success')({
  component: TicketsSuccess,
})

function TicketsSuccess() {
  return (
    <div className="artists-encore min-h-screen text-foreground flex items-start justify-center overflow-x-hidden">
      <div className="artists-vignette" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 pb-16 space-y-6">
        <section className="rounded-2xl bg-card p-6 shadow-lg border border-border">
          <h1 className="text-3xl font-bold">Payment confirmed</h1>
          <p className="text-muted-foreground mt-2">
            Thanks. Your tickets will appear in your account shortly.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link to="/tickets">View my tickets</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
