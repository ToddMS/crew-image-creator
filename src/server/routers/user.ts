import { z } from 'zod'
import { router, publicProcedure } from '../../lib/trpc'
import { prisma } from '../../lib/prisma'

export const userRouter = router({
  getAll: publicProcedure.query(async () => {
    return await prisma.user.findMany()
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await prisma.user.findUnique({
        where: { id: input.id }
      })
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email()
    }))
    .mutation(async ({ input }) => {
      return await prisma.user.create({
        data: {
          name: input.name,
          email: input.email
        }
      })
    })
})