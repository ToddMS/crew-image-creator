import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import { trpc } from './trpc-client'

// SSR-safe QueryClient factory
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
        // Prevent unnecessary background refetches
        refetchOnWindowFocus: false,
      },
    },
  })
}

// Browser-only QueryClient instance to prevent recreation during React suspense
let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  // Use SSR-safe QueryClient
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          // Add headers for authentication if needed
          async headers() {
            // Only access localStorage on the client side after hydration
            if (typeof window !== 'undefined' && window.localStorage) {
              try {
                const user = localStorage.getItem('rowgram_user')
                if (user) {
                  const userData = JSON.parse(user)
                  return {
                    authorization: `Bearer ${userData.token || ''}`,
                  }
                }
              } catch (e) {
                console.error('Failed to parse user token:', e)
              }
            }
            return {}
          },
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
