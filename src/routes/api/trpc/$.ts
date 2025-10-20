import { createFileRoute } from '@tanstack/react-router'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../../../server/routers/_app'

async function handler({ request }: { request: Request }) {
  // Extract the URL from the request, providing a fallback base URL
  const url = new URL(request.url || '/api/trpc', 'http://localhost:3000')

  // Create a new Request with the proper URL
  const requestWithUrl = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  })

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: requestWithUrl,
    router: appRouter,
    createContext: () => ({}),
  })
}

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
})
