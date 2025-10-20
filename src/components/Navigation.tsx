import { Link, useRouterState } from '@tanstack/react-router'
import { useAuth } from '../routes/__root'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Dashboard', key: 'dashboard' },
  { href: '/crews', label: 'Crews', key: 'crews' },
  { href: '/clubs', label: 'Clubs', key: 'clubs' },
  { href: '/generate', label: 'Generate Images', key: 'generate' },
  { href: '/gallery', label: 'Gallery', key: 'gallery' },
]

export function Navigation() {
  const router = useRouterState()
  const currentPath = router.location.pathname
  const { user, setUser, showAuthModal, setShowAuthModal } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const isActiveRoute = (href: string) => {
    if (href === '/' && currentPath === '/') return true
    if (href !== '/' && currentPath.startsWith(href)) return true
    return false
  }

  const handleLogout = () => {
    setUser(null)
    setShowDropdown(false)
  }

  return (
    <nav className="main-nav">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <img src="/RowGramImage.svg" alt="RowGram" className="logo-icon" />
          <span>RowGram</span>
        </Link>

        {/* Navigation Links */}
        <div className="nav-links">
          {navItems.map(({ href, label, key }) => (
            <Link
              key={key}
              to={href}
              className={`nav-link ${isActiveRoute(href) ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* User Actions */}
        <div className="nav-actions">
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '50px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <img
                  src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`}
                  alt={user.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
                <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                  {user.name}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    color: '#6b7280',
                    transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>

              {showDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999,
                    }}
                    onClick={() => setShowDropdown(false)}
                  />

                  {/* Dropdown menu */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.5rem',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      minWidth: '200px',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {user.email}
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        fontSize: '0.875rem',
                        color: '#dc2626',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              className="login-btn"
              onClick={() => setShowAuthModal(true)}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

    </nav>
  )
}