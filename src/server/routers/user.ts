import { z } from 'zod'
import { publicProcedure, router } from '../../lib/trpc'
import { prisma } from '../../lib/prisma'

export const userRouter = router({
  getAll: publicProcedure.query(async () => {
    return await prisma.user.findMany({
      include: {
        crews: true,
        savedImages: true,
      },
    })
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.user.findUnique({
        where: { id: input.id },
        include: {
          crews: {
            include: {
              boatType: true,
              savedImages: true,
            },
          },
          savedImages: {
            include: {
              crew: true,
              template: true,
            },
          },
        },
      })
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        avatarUrl: z.string().url().optional(),
        preferences: z.any().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          avatarUrl: input.avatarUrl,
          preferences: input.preferences,
        },
      })
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        avatarUrl: z.string().url().optional(),
        preferences: z.any().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return await prisma.user.update({
        where: { id },
        data,
      })
    }),
})
