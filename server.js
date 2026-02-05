import { createServer } from 'node:http'
import handler from './dist/server/server.js'

const port = process.env.PORT || 3000

const server = createServer(async (req, res) => {
  try {
    // Create a proper Request object for the TanStack Start handler
    const url = new URL(req.url, `http://localhost:${port}`)
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    })

    // Call the TanStack Start handler
    const response = await handler.fetch(request)

    // Set response status and headers
    res.statusCode = response.status
    for (const [key, value] of response.headers) {
      res.setHeader(key, value)
    }

    // Stream the response body
    if (response.body) {
      const reader = response.body.getReader()
      const pump = async () => {
        const { done, value } = await reader.read()
        if (done) {
          res.end()
        } else {
          res.write(value)
          await pump()
        }
      }
      await pump()
    } else {
      res.end()
    }
  } catch (error) {
    console.error('Server error:', error)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${port}`)
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  server.close(() => {
    process.exit(0)
  })
})