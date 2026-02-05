import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/test')({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({ message: 'Hello from API!', timestamp: Date.now() })
      },
    },
  },
})