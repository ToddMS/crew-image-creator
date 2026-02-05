import { createServer } from 'http'
import { createHTTPHandler } from '@trpc/server/adapters/standalone'

async function startTRPCServer() {
  try {
    // Import the router
    const { appRouter } = await import('./src/server/routers/_app.ts')

    const handler = createHTTPHandler({
      router: appRouter,
      createContext() {
        return {}
      },
    })

    const server = createServer((req, res) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }

      // Handle tRPC requests
      if (req.url?.startsWith('/api/trpc/')) {
        console.log('tRPC request:', req.method, req.url)
        return handler(req, res)
      }

      // 404 for other requests
      res.writeHead(404)
      res.end('Not Found')
    })

    server.listen(3001, () => {
      console.log('🚀 tRPC server running at http://localhost:3001')
      console.log('📡 Handling API requests for main app at localhost:3000')
    })
  } catch (error) {
    console.error('Failed to start tRPC server:', error)
    process.exit(1)
  }
}

startTRPCServer()