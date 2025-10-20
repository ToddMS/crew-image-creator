import { Link } from '@tanstack/react-router'

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/crews', label: 'Crews', icon: '🚣' },
  { href: '/clubs', label: 'Clubs', icon: '🏛️' },
  { href: '/generate', label: 'Generate', icon: '🎨' },
  { href: '/gallery', label: 'Gallery', icon: '🖼️' },
]

export function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            <span className="text-2xl">🚣‍♂️</span>
            <span>Crew Image Generator</span>
          </Link>

          {/* Navigation items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                activeProps={{
                  className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800',
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}