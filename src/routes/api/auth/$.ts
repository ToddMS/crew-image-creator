import { createFileRoute } from '@tanstack/react-router'
import { Auth } from '@auth/core'
import { authConfig } from '../../../lib/auth'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return await Auth(request, authConfig)
      },
      POST: async ({ request }) => {
        return await Auth(request, authConfig)
      },
    },
  },
})