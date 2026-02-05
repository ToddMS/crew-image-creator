import { createFileRoute } from '@tanstack/react-router'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../../../server/routers/_app'
import { db } from '../../../lib/prisma'

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return await fetchRequestHandler({
          endpoint: '/api/trpc',
          req: request,
          router: appRouter,
          createContext: () => ({ db }),
        })
      },
      POST: async ({ request }) => {
        return await fetchRequestHandler({
          endpoint: '/api/trpc',
          req: request,
          router: appRouter,
          createContext: () => ({ db }),
        })
      },
    },
  },
})