import { Link, createFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import '../dashboard.css'

export const Route = createFileRoute('/')({
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      auth: search.auth as string,
      user: search.user as string,
      error: search.error as string,
    }
  },
})

function DashboardPage() {
  const { auth, user: userParam, error } = useSearch({ from: '/' })
  const { user, setUser } = useAuth()

  useEffect(() => {
    if (auth === 'success' && userParam) {
      try {
        // Check if userParam is already an object or a string
        let userData
        if (typeof userParam === 'string') {
          userData = JSON.parse(decodeURIComponent(userParam))
        } else {
          userData = userParam
        }
        setUser(userData)
        // Clean up URL
        window.history.replaceState({}, '', '/')
      } catch (e) {
        console.error(
          'Failed to parse user data:',
          e,
          'userParam:',
          userParam,
          'type:',
          typeof userParam,
        )
      }
    }

    if (error) {
      alert('Authentication failed: ' + error)
      // Clean up URL
      window.history.replaceState({}, '', '/')
    }
  }, [auth, userParam, error, setUser])

  const handleActionClick = (action: string) => {
    // Navigation is handled by the Link components directly
  }

  return (
    <div className="dashboard-container">
      <div className="container">
        <section className="hero">
          <h1>{user ? 'Welcome back to RowGram' : 'Welcome to RowGram'}</h1>
          <p>
            {user
              ? 'Create professional rowing crew images for Instagram in just a few clicks'
              : 'Create professional rowing crew images for Instagram - Sign in to get started'}
          </p>
        </section>

        <div className="action-cards">
          <Link to="/crews" className="action-card">
            <h3 className="action-title">Create Crew</h3>
            <p className="action-description">
              Set up a new crew with members, cox, and coach details
            </p>
            <div className="action-arrow">
              Get started <span>→</span>
            </div>
          </Link>

          <Link to="/clubs" className="action-card">
            <h3 className="action-title">Manage Clubs</h3>
            <p className="action-description">
              Create and customise club presets with colors and branding
            </p>
            <div className="action-arrow">
              Manage <span>→</span>
            </div>
          </Link>

          <Link to="/generate" className="action-card">
            <h3 className="action-title">Generate Images</h3>
            <p className="action-description">
              Turn your crews into beautiful Instagram-ready images
            </p>
            <div className="action-arrow">
              Create now <span>→</span>
            </div>
          </Link>

          <Link to="/gallery" className="action-card">
            <h3 className="action-title">View Gallery</h3>
            <p className="action-description">
              Browse and download all your generated crew images
            </p>
            <div className="action-arrow">
              Browse <span>→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
