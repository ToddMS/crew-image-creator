interface LoadingStateProps {
  message?: string
  type?: 'spinner' | 'skeleton' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({
  message = "Loading...",
  type = 'spinner',
  size = 'md'
}: LoadingStateProps) {

  if (type === 'skeleton') {
    return <SkeletonLoader size={size} />
  }

  if (type === 'pulse') {
    return <PulseLoader message={message} size={size} />
  }

  return <SpinnerLoader message={message} size={size} />
}

function SpinnerLoader({ message, size }: { message: string; size: string }) {
  const spinnerSize = size === 'sm' ? '32px' : size === 'lg' ? '48px' : '40px'
  const fontSize = size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      textAlign: 'center',
      minHeight: '200px'
    }}>
      {/* Modern Spinner */}
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent, transparent, transparent, #2563eb)',
          animation: 'spin 1s linear infinite',
          marginBottom: '1.5rem',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: '2px',
            right: '2px',
            bottom: '2px',
            backgroundColor: 'white',
            borderRadius: '50%'
          }}
        />
      </div>

      <p style={{
        margin: 0,
        color: '#6b7280',
        fontSize,
        fontWeight: '500',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}>
        {message}
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

function PulseLoader({ message, size }: { message: string; size: string }) {
  const dotSize = size === 'sm' ? '8px' : size === 'lg' ? '12px' : '10px'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      gap: '1rem'
    }}>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor: '#2563eb',
              borderRadius: '50%',
              animation: `bounce 1.4s ease-in-out infinite both`,
              animationDelay: `${i * 0.16}s`
            }}
          />
        ))}
      </div>

      <p style={{
        margin: 0,
        color: '#6b7280',
        fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
        fontWeight: '500'
      }}>
        {message}
      </p>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          } 40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}

function SkeletonLoader({ size }: { size: string }) {
  const cardHeight = size === 'sm' ? '120px' : size === 'lg' ? '180px' : '150px'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '1rem',
      padding: '1rem'
    }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: cardHeight,
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
            padding: '1rem',
            animation: 'shimmer 1.5s ease-in-out infinite'
          }}
        >
          <div style={{
            width: '60%',
            height: '20px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            marginBottom: '0.75rem',
            animation: 'shimmer 1.5s ease-in-out infinite'
          }} />
          <div style={{
            width: '100%',
            height: '16px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            animation: 'shimmer 1.5s ease-in-out infinite',
            animationDelay: '0.1s'
          }} />
          <div style={{
            width: '80%',
            height: '16px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            animation: 'shimmer 1.5s ease-in-out infinite',
            animationDelay: '0.2s'
          }} />
        </div>
      ))}

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -468px 0;
          }
          100% {
            background-position: 468px 0;
          }
        }

        div[style*="shimmer"] {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 400% 100%;
        }
      `}</style>
    </div>
  )
}