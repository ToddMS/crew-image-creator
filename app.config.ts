import { defineConfig } from 'vinxi/config'

export default defineConfig({
  server: {
    preset: 'node-server',
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    rollupOptions: {
      external: ['@prisma/client']
    }
  },
})