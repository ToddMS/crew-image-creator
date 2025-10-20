import { z } from 'zod'
import { publicProcedure, router } from '../../lib/trpc'
import { prisma } from '../../lib/prisma'

export const clubRouter = router({
  getAll: publicProcedure.query(async () => {
    return await prisma.club.findMany({
      include: {
        user: true,
        crews: true,
      },
      orderBy: { name: 'asc' },
    })
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.club.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          crews: {
            include: {
              boatType: true,
            },
          },
        },
      })
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.club.findMany({
        where: { userId: input.userId },
        include: {
          crews: true,
        },
        orderBy: { name: 'asc' },
      })
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        primaryColor: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
        secondaryColor: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
        logoUrl: z.string().url().optional(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return await prisma.club.create({
        data: input,
        include: {
          user: true,
        },
      })
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        primaryColor: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
          .optional(),
        secondaryColor: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
          .optional(),
        logoUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return await prisma.club.update({
        where: { id },
        data,
        include: {
          user: true,
        },
      })
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.club.delete({
        where: { id: input.id },
      })
    }),
})
