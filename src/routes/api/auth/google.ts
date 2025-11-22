import { createFileRoute } from '@tanstack/react-router'

async function handleGoogleAuth() {
  // Google OAuth redirect URL
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
    {
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    },
  )}`

  return new Response(null, {
    status: 302,
    headers: {
      Location: googleAuthUrl,
    },
  })
}

export const Route = createFileRoute('/api/auth/google')({
  server: {
    handlers: {
      GET: handleGoogleAuth,
    },
  },
})
