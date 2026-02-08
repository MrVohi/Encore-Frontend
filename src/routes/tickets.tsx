import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tickets')({
  component: Tickets,
})

function Tickets() {
  return (
    <div className="artists-encore min-h-screen text-foreground flex items-start justify-center overflow-x-hidden">
      <div className="artists-vignette" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pb-16 space-y-6">
        <section className="rounded-2xl bg-card p-6 shadow-lg border border-border">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Plans</div>
              <h1 className="text-3xl font-bold">Tickets</h1>
              <p className="text-muted-foreground">
                Track your upcoming shows, past events, and saved ticket links.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--encore-primary)] bg-[var(--encore-bg-cream)] px-3 py-1 text-xs text-[var(--encore-text-dark)]">
              Coming soon
            </span>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-md border border-border text-sm text-muted-foreground">
          You do not have any tickets yet.
        </section>
      </div>
    </div>
  )
}
