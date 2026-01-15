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

function Root() {
  const [selected, setSelected] = useState<Artist | null>(null)

  useEffect(() => subscribeSelected(setSelected), [])

  return (
    <>
      <Header onSelectArtist={(a) => setSelected(a)} />
      <Outlet />
      <ArtistPopup artist={selected} open={selected !== null} onClose={() => setSelected(null)} />

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

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
})
