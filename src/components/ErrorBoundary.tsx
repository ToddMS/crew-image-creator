
interface ErrorBoundaryProps {
  error?: Error | string
  onRetry?: () => void
  title?: string
  message?: string
  children?: React.ReactNode
}

export function ErrorBoundary({
  error,
  onRetry,
  title = "Something went wrong",
  message,
  children
}: ErrorBoundaryProps) {
  const errorMessage = error
    ? typeof error === 'string'
      ? error
      : error.message || 'An unexpected error occurred'
    : message || 'An unexpected error occurred'

  if (!error && !message) {
    return <>{children}</>
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      textAlign: 'center',
      minHeight: '200px',
      background: 'linear-gradient(135deg, #fef7f7 0%, #fef2f2 100%)',
      border: '1px solid #fed7d7',
      borderRadius: '12px',
      margin: '1rem 0'
    }}>
      {/* Error Icon */}
      <div style={{
        width: '64px',
        height: '64px',
        backgroundColor: '#fee2e2',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>

      {/* Error Content */}
      <h3 style={{
        margin: '0 0 0.5rem 0',
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#991b1b'
      }}>
        {title}
      </h3>

      <p style={{
        margin: '0 0 2rem 0',
        color: '#7f1d1d',
        fontSize: '0.875rem',
        maxWidth: '400px',
        lineHeight: '1.5'
      }}>
        {errorMessage}
      </p>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
            Try Again
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: 'transparent',
            color: '#991b1b',
            border: '1px solid #f87171',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}