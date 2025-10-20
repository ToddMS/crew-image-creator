import { z } from 'zod'
import { publicProcedure, router } from '../../lib/trpc'
import { prisma } from '../../lib/prisma'

export const boatTypeRouter = router({
  getAll: publicProcedure.query(async () => {
    return await prisma.boatType.findMany({
      orderBy: [{ category: 'asc' }, { seats: 'asc' }],
    })
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.boatType.findUnique({
        where: { id: input.id },
        include: {
          crews: true,
        },
      })
    }),

  getByCategory: publicProcedure
    .input(z.object({ category: z.enum(['sculling', 'sweep']) }))
    .query(async ({ input }) => {
      return await prisma.boatType.findMany({
        where: { category: input.category },
        orderBy: { seats: 'asc' },
      })
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        code: z.string(),
        seats: z.number().int().positive(),
        category: z.enum(['sculling', 'sweep']),
        metadata: z.any().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return await prisma.boatType.create({
        data: input,
      })
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        code: z.string().optional(),
        seats: z.number().int().positive().optional(),
        category: z.enum(['sculling', 'sweep']).optional(),
        metadata: z.any().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return await prisma.boatType.update({
        where: { id },
        data,
      })
    }),
})
