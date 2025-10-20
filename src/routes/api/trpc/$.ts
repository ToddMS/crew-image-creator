import { createFileRoute } from '@tanstack/react-router'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { appRouter } from '../../../server/routers/_app'

function handler(request: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => ({}),
  })
}

export const Route = createAPIFileRoute('/api/trpc/$')({
  GET: handler,
  POST: handler,
})