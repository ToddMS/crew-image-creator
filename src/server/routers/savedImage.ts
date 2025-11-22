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
        userId: z.string().optional(),
        colors: z
          .object({
            primaryColor: z
              .string()
              .regex(/^#[0-9A-F]{6}$/i)
              .optional(),
            secondaryColor: z
              .string()
              .regex(/^#[0-9A-F]{6}$/i)
              .optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
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
        const validation = ImageGenerationService.validateGenerationInput(
          crew,
          template,
        )
        if (!validation.valid) {
          throw new Error(validation.error)
        }

        // Get or create demo user if userId not provided or invalid
        let userId = input.userId
        let validUser = null

        if (userId) {
          // Try to find the provided user
          validUser = await prisma.user.findUnique({
            where: { id: userId },
          })
        }

        if (!validUser) {
          // Either no userId provided or invalid userId, use/create demo user
          let demoUser = await prisma.user.findFirst({
            where: { email: 'demo@example.com' },
          })

          if (!demoUser) {
            demoUser = await prisma.user.create({
              data: {
                email: 'demo@example.com',
                name: 'Demo User',
              },
            })
          }
          userId = demoUser.id
        }

        // Generate the image with custom colors if provided
        const generatedImage = await ImageGenerationService.generateCrewImage(
          crew,
          template,
          input.colors,
        )

        // Save to database
        const savedImage = await prisma.savedImage.create({
          data: {
            crewId: input.crewId,
            templateId: input.templateId,
            userId: userId,
            imageUrl: generatedImage.imageUrl,
            filename: generatedImage.filename,
            metadata: {
              width: generatedImage.width,
              height: generatedImage.height,
              generatedAt: new Date().toISOString(),
              colors: input.colors || {
                primaryColor: crew.club?.primaryColor || '#15803d',
                secondaryColor: crew.club?.secondaryColor || '#f9a8d4',
              },
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
      } catch (error) {
        console.error('Image generation error:', error)
        throw new Error(
          `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }),

  generatePreview: publicProcedure
    .input(
      z.object({
        crewId: z.string(),
        templateId: z.string(),
        colors: z
          .object({
            primaryColor: z
              .string()
              .regex(/^#[0-9A-F]{6}$/i)
              .optional(),
            secondaryColor: z
              .string()
              .regex(/^#[0-9A-F]{6}$/i)
              .optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
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
        const validation = ImageGenerationService.validateGenerationInput(
          crew,
          template,
        )
        if (!validation.valid) {
          throw new Error(validation.error)
        }

        // Generate preview image (same as regular but not saved to DB)
        const generatedImage = await ImageGenerationService.generateCrewImage(
          crew,
          template,
          input.colors,
        )

        return {
          imageUrl: generatedImage.imageUrl,
          filename: generatedImage.filename,
          width: generatedImage.width,
          height: generatedImage.height,
        }
      } catch (error) {
        console.error('Preview generation error:', error)
        throw new Error(
          `Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }),
})
