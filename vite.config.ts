import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@tanstack/react-router',
      '@trpc/client',
      '@trpc/react-query',
    ],
    exclude: ['@prisma/client'],
  },
  define: {
    // Prevent Node.js modules from being included in browser build
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Prevent server-only modules from being bundled for the browser
      'node:async_hooks': false,
      'node:buffer': false,
      'node:fs': false,
      'node:path': false,
      'path': false,
      'stream': false,
      'multer': false,
      'sharp': false,
      'Buffer': false,
    },
  },
})
