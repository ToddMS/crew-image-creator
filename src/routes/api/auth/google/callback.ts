import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '../../../../lib/prisma'

async function handleGoogleCallback({ request }: { request: Request }) {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) {
      // Redirect to home page with error
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/?error=google_auth_failed',
        },
      })
    }

    if (!code) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/?error=no_code',
        },
      })
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
        }),
      })

      const tokens = await tokenResponse.json()

      if (!tokens.access_token) {
        throw new Error('No access token received')
      }

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      })

      const googleUser = await userResponse.json()

      // Find or create user in database
      let user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            image: googleUser.picture,
          },
        })
      } else {
        // Update existing user with latest Google info
        user = await prisma.user.update({
          where: { email: googleUser.email },
          data: {
            name: googleUser.name,
            image: googleUser.picture,
          },
        })
      }

      // In a real app, you'd create a session/JWT here
      // For now, just redirect to home page with success
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/?auth=success&user=' + encodeURIComponent(JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
          })),
        },
      })
    } catch (error) {
      console.error('Google OAuth error:', error)
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/?error=auth_failed',
        },
      })
    }
}

export const Route = createFileRoute('/api/auth/google/callback')({
  server: {
    handlers: {
      GET: handleGoogleCallback,
    },
  },
})