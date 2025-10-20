import { Link, useRouterState } from '@tanstack/react-router'

const navItems = [
  { href: '/', label: 'Dashboard', key: 'dashboard' },
  { href: '/crews', label: 'My Crews', key: 'crews' },
  { href: '/clubs', label: 'Club Presets', key: 'clubs' },
  { href: '/generate', label: 'Generate Images', key: 'generate' },
  { href: '/gallery', label: 'Gallery', key: 'gallery' },
]

export function Navigation() {
  const router = useRouterState()
  const currentPath = router.location.pathname

  const isActiveRoute = (href: string) => {
    if (href === '/' && currentPath === '/') return true
    if (href !== '/' && currentPath.startsWith(href)) return true
    return false
  }

  // User handling is not implemented yet

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
          <button className="login-btn">
            Sign In
          </button>
        </div>
      </div>
    </nav>
  )
}