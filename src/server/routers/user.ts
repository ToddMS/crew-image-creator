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

  getByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      return await prisma.user.findUnique({
        where: { email: input.email },
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

  signup: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Hash password
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash(input.password, 12)

      // Create user
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
        },
      })

      // Return user without password
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
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
