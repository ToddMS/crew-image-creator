import { z } from 'zod'
import { publicProcedure, router } from '../../lib/trpc'
import { prisma } from '../../lib/prisma'

export const crewRouter = router({
  getAll: publicProcedure.query(async () => {
    try {
      // First try a simple query without includes
      return await prisma.crew.findMany({
        include: {
          boatType: true,
        },
      })
    } catch (error) {
      console.error('Error fetching crews:', error)
      // Return empty array if there's an error
      return []
    }
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.crew.findUnique({
        where: { id: input.id },
        include: {
          boatType: true,
          user: true,
          club: true,
          savedImages: {
            include: {
              template: true,
            },
          },
        },
      })
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.crew.findMany({
        where: { userId: input.userId },
        include: {
          boatType: true,
          savedImages: {
            include: {
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
        clubName: z.string().optional(), // Optional fallback club name
        clubId: z.string().optional(), // Optional club preset reference
        raceName: z.string().optional(),
        boatName: z.string().optional(),
        coachName: z.string().optional(),
        crewNames: z.array(z.string()),
        boatTypeId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return await prisma.crew.create({
        data: input,
        include: {
          boatType: true,
          user: true,
          club: true,
        },
      })
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        clubName: z.string().optional(),
        raceName: z.string().optional(),
        boatName: z.string().optional(),
        coachName: z.string().optional(),
        crewNames: z.array(z.string()).optional(),
        boatTypeId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return await prisma.crew.update({
        where: { id },
        data,
        include: {
          boatType: true,
          user: true,
          club: true,
        },
      })
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.crew.delete({
        where: { id: input.id },
      })
    }),
})
