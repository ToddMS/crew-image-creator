import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  token?: string
  picture?: string
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    try {
      const storedUser = localStorage.getItem('rowgram_user')
      if (storedUser) {
        const userData = JSON.parse(storedUser) as User
        setUserState(userData)
      }
    } catch (e) {
      console.error('Failed to parse stored user:', e)
      localStorage.removeItem('rowgram_user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setUser = (userData: User | null) => {
    setUserState(userData)
    if (hasMounted) {
      if (userData) {
        localStorage.setItem('rowgram_user', JSON.stringify(userData))
      } else {
        localStorage.removeItem('rowgram_user')
      }
    }
  }

  const contextValue: AuthContextType = {
    user,
    setUser,
    showAuthModal,
    setShowAuthModal,
    isLoading: isLoading && !hasMounted,
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

export type { User, AuthContextType }