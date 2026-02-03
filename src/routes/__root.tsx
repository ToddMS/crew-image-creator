import { Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { Navigation } from '../components/Navigation'
import { AppProviders } from '../app/providers'

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: (props) => {
    return (
      <RootDocument>
        <div className="error-boundary">
          <h1>Something went wrong!</h1>
          <details>
            <summary>Error details</summary>
            <pre>{props.error.message}</pre>
          </details>
        </div>
      </RootDocument>
    )
  },
  notFoundComponent: () => (
    <RootDocument>
      <div className="not-found">
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist.</p>
      </div>
    </RootDocument>
  ),
})

function RootComponent() {
  return (
    <RootDocument>
      <AppProviders>
        <Navigation />
        <main>
          <Outlet />
        </main>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      </AppProviders>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Scripts />
    </>
  )
}

