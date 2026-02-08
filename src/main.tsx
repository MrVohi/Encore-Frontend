import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider'
import { AuthProvider } from './integrations/auth-context'
import { routeTree } from './routeTree.gen'

import './styles.css'
import reportWebVitals from './reportWebVitals'
import "./sentry"

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()

const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProviderContext,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')
if (!rootElement) throw new Error('Root element #app not found')

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
        <RouterProvider router={router} />
      </TanStackQueryProvider.Provider>
    </AuthProvider>
  </StrictMode>,
)

reportWebVitals()
