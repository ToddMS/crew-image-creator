import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import { trpc } from '../lib/trpc-client'
import { AuthProvider, useAuth } from '../lib/auth-context'
import { AuthModal } from '../components/AuthModal'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

function TRPCProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          async headers() {
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
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      </QueryClientProvider>
    </trpc.Provider>
  )
}

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <AuthProvider>
        <AppContent>
          {children}
        </AppContent>
      </AuthProvider>
    </TRPCProvider>
  )
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { showAuthModal, setShowAuthModal, setUser } = useAuth()

  const handleAuthSuccess = (userData: any) => {
    console.log('User signed in:', userData)
    setUser(userData)
    setShowAuthModal(false)
  }

  return (
    <>
      {children}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}

export { AppProviders }