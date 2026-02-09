import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools"

import Header from "../components/Header"
import ArtistPopup from '@/features/artists/components/ArtistPopup'
import type { Artist } from '@/types/artist'
import { subscribeSelected } from '@/features/artists/state/selected'

import type { QueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const [selected, setSelected] = useState<Artist | null>(null)

  useEffect(() => subscribeSelected(setSelected), [])

  return (
    <>
      <div className="theme-test theme-test-mock app-shell">
        <div className="theme-test-decor" aria-hidden="true" />
        <Header onSelectArtist={(a) => setSelected(a)} />
        <main className="app-content">
          <Outlet />
        </main>
        <div className="app-banner app-banner-bottom text-[var(--encore-text-dark)] text-sm font-semibold px-4 py-2 text-center border-t-[3px] border-border uppercase">
          Ticket ordering is coming soon. Stay tuned for concert seat reservations.
        </div>
        <ArtistPopup artist={selected} open={selected !== null} onClose={() => setSelected(null)} />
      </div>

      <TanStackDevtools
        config={{ position: "bottom-right" }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </>
  )
}
