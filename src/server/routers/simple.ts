import { z } from 'zod'
import { publicProcedure, router } from '../../lib/trpc'

export const simpleRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
        timestamp: new Date().toISOString(),
      }
    }),

  status: publicProcedure
    .query(() => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      }
    }),
})