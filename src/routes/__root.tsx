import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { Navigation } from '../components/Navigation'
import { TRPCProvider } from '../lib/trpc-provider'
import { AuthModal } from '../components/AuthModal'
import { useState, createContext, useContext, useEffect } from 'react'

// Create auth context
interface AuthContextType {
  user: any
  setUser: (user: any) => void
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  showAuthModal: false,
  setShowAuthModal: () => {},
})

export const useAuth = () => useContext(AuthContext)

import appCss from '../styles.css?url'
import dashboardCss from '../dashboard.css?url'

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
        title: 'RowGram',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'stylesheet',
        href: dashboardCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/RowGramImage.svg',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('rowgram_user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          console.error('Failed to parse stored user:', e)
          localStorage.removeItem('rowgram_user')
        }
      }
    }
  }, [])

  const handleSetUser = (userData: any) => {
    setUser(userData)
    if (typeof window !== 'undefined') {
      if (userData) {
        localStorage.setItem('rowgram_user', JSON.stringify(userData))
      } else {
        localStorage.removeItem('rowgram_user')
      }
    }
  }

  const handleAuthSuccess = (userData: any) => {
    handleSetUser(userData)
    console.log('User signed in:', userData)
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TRPCProvider>
          <AuthContext.Provider value={{ user, setUser: handleSetUser, showAuthModal, setShowAuthModal }}>
            <Navigation />
            <main>
              {children}
            </main>
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onSuccess={handleAuthSuccess}
            />
          </AuthContext.Provider>
          <ReactQueryDevtools initialIsOpen={false} />
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </TRPCProvider>
        <Scripts />
      </body>
    </html>
  )
}
