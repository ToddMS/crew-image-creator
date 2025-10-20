import { createFileRoute, Link } from '@tanstack/react-router'
import '../dashboard.css'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  // Mock user state for now - in the original this comes from auth context
  const user = null

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
            <p className="action-description">Browse and download all your generated crew images</p>
            <div className="action-arrow">
              Browse <span>→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
