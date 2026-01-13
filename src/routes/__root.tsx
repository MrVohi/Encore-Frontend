import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Header />

      {/* App layout */}
      <div className="min-h-[100dvh] pt-16">
        {/* If you have an aside that is always there on desktop */}
        <div className="grid min-h-[calc(100dvh-4rem)] grid-cols-1 md:grid-cols-[280px_1fr]">
          {/* Sidebar / Aside (optional) */}
          <aside className="hidden md:block border-r border-white/10">
            {/* Your aside content / component here */}
          </aside>

          {/* Page content */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* devtools unchanged */}
      <TanStackDevtools />
    </>
  )
})