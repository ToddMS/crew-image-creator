import { z } from 'zod'
import { publicProcedure, router } from '../../lib/trpc'
import { prisma } from '../../lib/prisma'
import { ImageGenerationService } from '../../lib/imageGeneration'

export const savedImageRouter = router({
  getAll: publicProcedure.query(async () => {
    return await prisma.savedImage.findMany({
      include: {
        crew: {
          include: {
            boatType: true,
          },
        },
        template: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.savedImage.findUnique({
        where: { id: input.id },
        include: {
          crew: {
            include: {
              boatType: true,
            },
          },
          template: true,
          user: true,
        },
      })
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.savedImage.findMany({
        where: { userId: input.userId },
        include: {
          crew: {
            include: {
              boatType: true,
            },
          },
          template: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  getByCrewId: publicProcedure
    .input(z.object({ crewId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.savedImage.findMany({
        where: { crewId: input.crewId },
        include: {
          template: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  create: publicProcedure
    .input(
      z.object({
        filename: z.string(),
        imageUrl: z.string().url(),
        fileSize: z.number().int().optional(),
        dimensions: z.any().optional(),
        metadata: z.any().optional(),
        crewId: z.string(),
        templateId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return await prisma.savedImage.create({
        data: input,
        include: {
          crew: {
            include: {
              boatType: true,
            },
          },
          template: true,
          user: true,
        },
      })
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        filename: z.string().optional(),
        imageUrl: z.string().url().optional(),
        fileSize: z.number().int().optional(),
        dimensions: z.any().optional(),
        metadata: z.any().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return await prisma.savedImage.update({
        where: { id },
        data,
        include: {
          crew: {
            include: {
              boatType: true,
            },
          },
          template: true,
          user: true,
        },
      })
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.savedImage.delete({
        where: { id: input.id },
      })
    }),

  generate: publicProcedure
    .input(
      z.object({
        crewId: z.string(),
        templateId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Get crew and template data
      const crew = await prisma.crew.findUnique({
        where: { id: input.crewId },
        include: {
          boatType: true,
          club: true,
        },
      })

      if (!crew) {
        throw new Error('Crew not found')
      }

      const template = await prisma.template.findUnique({
        where: { id: input.templateId },
      })

      if (!template) {
        throw new Error('Template not found')
      }

      // Validate input
      const validation = ImageGenerationService.validateGenerationInput(crew, template)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Generate the image
      const generatedImage = await ImageGenerationService.generateCrewImage(crew, template)

      // Save to database
      const savedImage = await prisma.savedImage.create({
        data: {
          crewId: input.crewId,
          templateId: input.templateId,
          userId: input.userId,
          imageUrl: generatedImage.imageUrl,
          filename: generatedImage.filename,
          metadata: {
            width: generatedImage.width,
            height: generatedImage.height,
            generatedAt: new Date().toISOString(),
          },
        },
        include: {
          crew: {
            include: {
              boatType: true,
              club: true,
            },
          },
          template: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return savedImage
    }),
})
