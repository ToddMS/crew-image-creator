import { z } from 'zod'
import { router, publicProcedure } from '../../lib/trpc'
import { prisma } from '../../lib/prisma'

export const crewImageRouter = router({
  getAll: publicProcedure.query(async () => {
    return await prisma.crewImage.findMany({
      include: { user: true }
    })
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await prisma.crewImage.findUnique({
        where: { id: input.id },
        include: { user: true }
      })
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await prisma.crewImage.findMany({
        where: { userId: input.userId },
        include: { user: true }
      })
    }),

  create: publicProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      imageUrl: z.string().url().optional(),
      userId: z.number()
    }))
    .mutation(async ({ input }) => {
      return await prisma.crewImage.create({
        data: {
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          userId: input.userId
        },
        include: { user: true }
      })
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string().url().optional()
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return await prisma.crewImage.update({
        where: { id },
        data,
        include: { user: true }
      })
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await prisma.crewImage.delete({
        where: { id: input.id }
      })
    })
})