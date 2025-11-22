import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { Navigation } from '../components/Navigation'
import { AppProviders } from '../app/providers'

import appCss from '../styles/globals.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'RowGram - Professional Rowing Crew Images',
      },
      {
        name: 'description',
        content:
          'Create professional rowing crew images for Instagram in just a few clicks',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/RowGramImage.svg',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
    ],
  }),

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
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

