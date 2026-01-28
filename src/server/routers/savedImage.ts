import { z } from 'zod'
import { publicProcedure, router } from '../../lib/trpc'
import { prisma } from '../../lib/prisma'
import { ImageGenerationService } from '../../lib/imageGeneration'
import JSZip from 'jszip'
import fs from 'node:fs/promises'
import path from 'node:path'

// Helper function to generate club abbreviation from club name
function generateClubAbbreviation(clubName: string): string {
  // Handle common patterns
  const cleanedName = clubName.trim()

  // Common abbreviations
  if (cleanedName.toLowerCase().includes('london') && cleanedName.toLowerCase().includes('rowing')) return 'LRC'
  if (cleanedName.toLowerCase().includes('cambridge') && cleanedName.toLowerCase().includes('university')) return 'CUBC'
  if (cleanedName.toLowerCase().includes('oxford') && cleanedName.toLowerCase().includes('university')) return 'OUBC'
  if (cleanedName.toLowerCase().includes('thames') && cleanedName.toLowerCase().includes('rowing')) return 'TRC'
  if (cleanedName.toLowerCase().includes('leander') && cleanedName.toLowerCase().includes('club')) return 'LRC'

  // For other clubs, create abbreviation from significant words
  const words = cleanedName
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => {
      const lower = word.toLowerCase()
      // Skip common words
      return !['rowing', 'boat', 'club', 'the', 'and', 'of', 'bc', 'rc'].includes(lower)
    })

  if (words.length === 0) {
    // Fallback: take first 4 characters of club name
    return cleanedName.replace(/[^\w]/g, '').substring(0, 4).toUpperCase()
  }

  // Create abbreviation from first letters of significant words
  let abbreviation = ''
  for (const word of words) {
    if (abbreviation.length < 4) {
      abbreviation += word.charAt(0).toUpperCase()
    }
  }

  // Ensure minimum length
  if (abbreviation.length < 2) {
    abbreviation = cleanedName.replace(/[^\w]/g, '').substring(0, 4).toUpperCase()
  }

  return abbreviation
}

// Helper function to create safe filename from boat name
function createBoatFilename(boatName: string | null | undefined, fallbackFilename: string): string {
  if (!boatName?.trim()) {
    return fallbackFilename
  }

  // Clean boat name and make it safe for filename
  const cleanBoatName = boatName
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .toLowerCase()

  // Add .png extension
  return `${cleanBoatName}.png`
}

export const savedImageRouter = router({
  getAll: publicProcedure.query(async () => {
    return await prisma.savedImage.findMany({
      include: {
        crew: {
          include: {
            boatType: true,
            club: true,
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
              club: true,
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
              club: true,
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
        clubId: z.string().optional(),
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
        console.log('🚀 DEBUG: SavedImage.generate mutation called with input:')
        console.log('  - crewId:', input.crewId)
        console.log('  - templateId:', input.templateId)
        console.log('  - userId:', input.userId)
        console.log('  - clubId:', input.clubId)
        console.log('  - colors:', input.colors)

        // Get crew and template data
        const crew = await prisma.crew.findUnique({
          where: { id: input.crewId },
          include: {
            boatType: true,
            club: true,
          },
        })

        // Get selected club if provided
        let selectedClub = null
        if (input.clubId) {
          selectedClub = await prisma.club.findUnique({
            where: { id: input.clubId },
          })
          console.log('  - Found selected club:', selectedClub?.name, 'with logo:', selectedClub?.logoUrl)
        }

        if (!crew) {
          throw new Error('Crew not found')
        }
        console.log('  - Found crew:', crew.id, crew.name)

        const template = await prisma.template.findUnique({
          where: { id: input.templateId },
        })

        if (!template) {
          throw new Error('Template not found')
        }
        console.log('  - Found template:', template.id, template.name, template.templateType)

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

        // Create crew with selected club for image generation
        const crewWithSelectedClub = selectedClub
          ? { ...crew, club: selectedClub }
          : crew

        // Generate the image with custom colors if provided
        const generatedImage = await ImageGenerationService.generateCrewImage(
          crewWithSelectedClub,
          template,
          input.colors && input.colors.primaryColor && input.colors.secondaryColor ? input.colors : undefined,
        )

        // Save to database
        const savedImage = await prisma.savedImage.create({
          data: {
            crewId: input.crewId,
            templateId: input.templateId,
            userId: userId!, // userId is guaranteed to be valid at this point
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
        clubId: z.string().optional(),
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

        // Get selected club if provided
        let selectedClub = null
        if (input.clubId) {
          selectedClub = await prisma.club.findUnique({
            where: { id: input.clubId },
          })
        }

        if (!crew) {
          throw new Error('Crew not found')
        }

        const template = await prisma.template.findUnique({
          where: { id: input.templateId },
        })

        if (!template) {
          throw new Error('Template not found')
        }

        // Create crew with selected club for image generation
        const crewWithSelectedClub = selectedClub
          ? { ...crew, club: selectedClub }
          : crew

        // Validate input
        const validation = ImageGenerationService.validateGenerationInput(
          crewWithSelectedClub,
          template,
        )
        if (!validation.valid) {
          throw new Error(validation.error)
        }

        // Generate preview image (same as regular but not saved to DB)
        const generatedImage = await ImageGenerationService.generateCrewImage(
          crewWithSelectedClub,
          template,
          input.colors && input.colors.primaryColor && input.colors.secondaryColor ? input.colors : undefined,
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

  generateBatch: publicProcedure
    .input(
      z.object({
        crewIds: z.array(z.string()),
        templateId: z.string(),
        userId: z.string().optional(),
        clubId: z.string().optional(),
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
        console.log('🚀 DEBUG: SavedImage.generateBatch mutation called with input:')
        console.log('  - crewIds:', input.crewIds)
        console.log('  - templateId:', input.templateId)
        console.log('  - userId:', input.userId)
        console.log('  - clubId:', input.clubId)
        console.log('  - colors:', input.colors)

        const results = []
        const errors = []

        // Get template once
        const template = await prisma.template.findUnique({
          where: { id: input.templateId },
        })

        if (!template) {
          throw new Error('Template not found')
        }

        // Get selected club if provided
        let selectedClub = null
        if (input.clubId) {
          selectedClub = await prisma.club.findUnique({
            where: { id: input.clubId },
          })
        }

        // Get or create demo user if userId not provided or invalid
        let userId = input.userId
        let validUser = null

        if (userId) {
          validUser = await prisma.user.findUnique({
            where: { id: userId },
          })
        }

        if (!validUser) {
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

        // Process each crew
        for (const crewId of input.crewIds) {
          try {
            // Get crew data
            const crew = await prisma.crew.findUnique({
              where: { id: crewId },
              include: {
                boatType: true,
                club: true,
              },
            })

            if (!crew) {
              errors.push({ crewId, error: 'Crew not found' })
              continue
            }

            // Validate input
            const validation = ImageGenerationService.validateGenerationInput(crew, template)
            if (!validation.valid) {
              errors.push({ crewId, error: validation.error })
              continue
            }

            // Create crew with selected club for image generation
            const crewWithSelectedClub = selectedClub ? { ...crew, club: selectedClub } : crew

            // Generate the image
            const generatedImage = await ImageGenerationService.generateCrewImage(
              crewWithSelectedClub,
              template,
              input.colors && input.colors.primaryColor && input.colors.secondaryColor ? input.colors : undefined,
            )

            // Save to database
            const savedImage = await prisma.savedImage.create({
              data: {
                crewId: crewId,
                templateId: input.templateId,
                userId: userId!, // userId is guaranteed to be valid at this point
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

            results.push(savedImage)
            console.log(`✅ Generated image for crew: ${crew.name}`)

          } catch (crewError) {
            console.error(`❌ Error generating image for crew ${crewId}:`, crewError)
            errors.push({
              crewId,
              error: crewError instanceof Error ? crewError.message : 'Unknown error',
            })
          }
        }

        return {
          success: results,
          errors: errors,
          total: input.crewIds.length,
          successful: results.length,
          failed: errors.length,
        }
      } catch (error) {
        console.error('Batch image generation error:', error)
        throw new Error(
          `Failed to generate batch images: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }),

  downloadWithCover: publicProcedure
    .input(z.object({
      savedImageId: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('🚀 DEBUG: downloadWithCover mutation called with input:', input.savedImageId)

        // Get saved image with all related data
        const savedImage = await prisma.savedImage.findUnique({
          where: { id: input.savedImageId },
          include: {
            crew: {
              include: {
                boatType: true,
                club: true,
              },
            },
            template: true,
            user: true,
          },
        })

        if (!savedImage) {
          throw new Error('Saved image not found')
        }

        console.log('  - Found saved image:', savedImage.filename)
        console.log('  - Crew:', savedImage.crew.name, savedImage.crew.raceName)
        console.log('🎯 DEBUG: Full crew club data:', JSON.stringify(savedImage.crew.club, null, 2))

        // Generate cover image using the crew's race data
        const raceData = {
          raceName: savedImage.crew.raceName || 'Crew Announcement',
          raceDate: savedImage.crew.raceDate,
          club: savedImage.crew.club,
        }

        // Use colors from the saved image metadata if available
        const colors = savedImage.metadata?.colors ? {
          primaryColor: savedImage.metadata.colors.primaryColor,
          secondaryColor: savedImage.metadata.colors.secondaryColor,
        } : undefined

        console.log('🎯 DEBUG: Race data being passed to generateCoverImage:')
        console.log('  - Race Name:', raceData.raceName)
        console.log('  - Race Date:', raceData.raceDate)
        console.log('  - Club Name:', raceData.club?.name)
        console.log('  - Club Logo URL:', raceData.club?.logoUrl)
        const coverImage = await ImageGenerationService.generateCoverImage(
          raceData,
          savedImage.template,
          colors
        )

        console.log('  - Cover image generated:', coverImage.filename)

        // Create ZIP file
        const zip = new JSZip()

        // Read original crew image from filesystem
        const crewImagePath = path.join(process.cwd(), 'public', savedImage.imageUrl)
        console.log('  - Reading crew image from filesystem:', crewImagePath)
        const crewImageBuffer = await fs.readFile(crewImagePath)

        // Read cover image from filesystem
        const coverImagePath = path.join(process.cwd(), 'public', coverImage.imageUrl)
        console.log('  - Reading cover image from filesystem:', coverImagePath)
        const coverImageBuffer = await fs.readFile(coverImagePath)

        // Add files to ZIP using boat name
        const crewFilename = createBoatFilename(savedImage.crew.boatName, savedImage.filename)
        const coverFilename = `${savedImage.crew.raceName || 'race'}-cover.png`

        zip.file(crewFilename, crewImageBuffer)
        zip.file(coverFilename, coverImageBuffer)

        console.log('  - Added files to ZIP:', crewFilename, coverFilename)

        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

        // Convert to base64 for transmission
        const zipBase64 = zipBuffer.toString('base64')

        console.log('  - ZIP created successfully, size:', zipBuffer.length, 'bytes')

        return {
          zipData: zipBase64,
          filename: `${savedImage.crew.name || savedImage.crew.raceName || 'crew'}-images.zip`,
          size: zipBuffer.length
        }

      } catch (error) {
        console.error('Download with cover error:', error)
        throw new Error(
          `Failed to create download package: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }),

  batchDownload: publicProcedure
    .input(z.object({
      savedImageIds: z.array(z.string()),
      mode: z.enum(['auto', 'all-together', 'by-club', 'by-race', 'by-club-race', 'covers-only', 'images-only']).optional().default('auto')
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('🚀 DEBUG: batchDownload called with:', input.savedImageIds.length, 'images, mode:', input.mode)

        // Get all saved images with related data
        const savedImages = await prisma.savedImage.findMany({
          where: { id: { in: input.savedImageIds } },
          include: {
            crew: {
              include: {
                boatType: true,
                club: true,
              },
            },
            template: true,
            user: true,
          },
        })

        if (savedImages.length === 0) {
          throw new Error('No images found')
        }

        // Analyze race/club groupings
        const raceGroups = new Map<string, typeof savedImages>()
        const clubGroups = new Map<string, typeof savedImages>()

        for (const image of savedImages) {
          const raceKey = image.crew.raceName || 'No Race'
          const clubKey = image.crew.club?.name || image.crew.clubName || 'No Club'

          if (!raceGroups.has(raceKey)) raceGroups.set(raceKey, [])
          if (!clubGroups.has(clubKey)) clubGroups.set(clubKey, [])

          raceGroups.get(raceKey)!.push(image)
          clubGroups.get(clubKey)!.push(image)
        }

        const hasMultipleRaces = raceGroups.size > 1
        const hasMultipleClubs = clubGroups.size > 1
        const isMixed = hasMultipleRaces || hasMultipleClubs

        console.log('  - Analysis:', {
          totalImages: savedImages.length,
          races: Array.from(raceGroups.keys()),
          clubs: Array.from(clubGroups.keys()),
          isMixed
        })

        // Determine action based on mode and analysis
        if (input.mode === 'auto' && isMixed) {
          // Return analysis for frontend to show modal
          console.log('🚀 DEBUG: Returning analysis data for modal')
          return {
            requiresUserChoice: true,
            analysisData: {
              totalImages: savedImages.length,
              raceGroups: Array.from(raceGroups.entries()).map(([raceName, images]) => ({
                raceName,
                count: images.length
              })),
              clubGroups: Array.from(clubGroups.entries()).map(([clubName, images]) => ({
                clubName,
                count: images.length
              })),
              hasMixedRaces: hasMultipleRaces,
              hasMixedClubs: hasMultipleClubs
            }
          }
        }

        // Mode: all-together - Single ZIP with all images and cover
        if (input.mode === 'all-together' || (!isMixed && input.mode === 'auto')) {
          const zip = new JSZip()

          // Add all crew images to ZIP with boat names
          for (const image of savedImages) {
            const crewImagePath = path.join(process.cwd(), 'public', image.imageUrl)
            const crewImageBuffer = await fs.readFile(crewImagePath)

            // Use boat name for filename, fall back to original filename
            const boatFilename = createBoatFilename(image.crew.boatName, image.filename)
            zip.file(boatFilename, crewImageBuffer)
          }

          // Add cover image if not mixed or forced
          if (!isMixed || input.mode === 'all-together') {
            const firstImage = savedImages[0]
            const raceData = {
              raceName: firstImage.crew.raceName || (isMixed ? 'Mixed Races' : 'Race'),
              raceDate: firstImage.crew.raceDate || undefined,
              club: firstImage.crew.club
            }

            const colors = {
              primaryColor: firstImage.crew.club?.primaryColor || '#15803d',
              secondaryColor: firstImage.crew.club?.secondaryColor || '#f9a8d4',
            }

            const coverImage = await ImageGenerationService.generateCoverImage(
              raceData,
              firstImage.template!,
              colors
            )

            const coverImagePath = path.join(process.cwd(), 'public', coverImage.imageUrl)
            const coverImageBuffer = await fs.readFile(coverImagePath)
            const coverFilename = `${raceData.raceName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-cover.png`
            zip.file(coverFilename, coverImageBuffer)

            console.log('  - Added cover image:', coverFilename)
          }

          // Generate ZIP
          const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
          const zipBase64 = zipBuffer.toString('base64')

          const filename = isMixed
            ? `all-selected-images.zip`
            : `${savedImages[0].crew.raceName?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'race'}.zip`

          console.log('🚀 DEBUG: Returning all-together download, filename:', filename, 'size:', zipBuffer.length)
          return {
            downloads: [{
              zipData: zipBase64,
              filename
            }]
          }
        }

        // Mode: by-race - Create separate ZIPs for each race
        if (input.mode === 'by-race') {
          const downloads = []

          for (const [raceName, raceImages] of raceGroups.entries()) {
            const zip = new JSZip()

            // Add crew images for this race with boat names
            for (const image of raceImages) {
              const crewImagePath = path.join(process.cwd(), 'public', image.imageUrl)
              const crewImageBuffer = await fs.readFile(crewImagePath)

              // Use boat name for filename, fall back to original filename
              const boatFilename = createBoatFilename(image.crew.boatName, image.filename)
              zip.file(boatFilename, crewImageBuffer)
            }

            // Add race cover image
            const firstImage = raceImages[0]
            const raceData = {
              raceName,
              raceDate: firstImage.crew.raceDate || undefined,
              club: firstImage.crew.club
            }

            const colors = {
              primaryColor: firstImage.crew.club?.primaryColor || '#15803d',
              secondaryColor: firstImage.crew.club?.secondaryColor || '#f9a8d4',
            }

            const coverImage = await ImageGenerationService.generateCoverImage(
              raceData,
              firstImage.template!,
              colors
            )

            const coverImagePath = path.join(process.cwd(), 'public', coverImage.imageUrl)
            const coverImageBuffer = await fs.readFile(coverImagePath)
            const coverFilename = `${raceName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-cover.png`
            zip.file(coverFilename, coverImageBuffer)

            // Generate ZIP for this race
            const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
            const zipBase64 = zipBuffer.toString('base64')
            const safeRaceName = raceName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            const filename = `${safeRaceName}.zip`

            downloads.push({
              zipData: zipBase64,
              filename
            })
          }

          console.log('🚀 DEBUG: Returning by-race downloads:', downloads.length, 'ZIPs')
          return { downloads }
        }

        // Mode: by-club - Create separate ZIPs for each club
        if (input.mode === 'by-club') {
          const downloads = []

          for (const [clubName, clubImages] of clubGroups.entries()) {
            const zip = new JSZip()

            // Add crew images for this club with boat names
            for (const image of clubImages) {
              const crewImagePath = path.join(process.cwd(), 'public', image.imageUrl)
              const crewImageBuffer = await fs.readFile(crewImagePath)

              // Use boat name for filename, fall back to original filename
              const boatFilename = createBoatFilename(image.crew.boatName, image.filename)
              zip.file(boatFilename, crewImageBuffer)
            }

            // Add club cover image using the main race or generic
            const firstImage = clubImages[0]
            const clubAbbr = generateClubAbbreviation(clubName)

            const raceData = {
              raceName: hasMultipleRaces ? `${clubName} Crews` : (firstImage.crew.raceName || 'Club Announcement'),
              raceDate: firstImage.crew.raceDate || undefined,
              club: firstImage.crew.club
            }

            const colors = {
              primaryColor: firstImage.crew.club?.primaryColor || '#15803d',
              secondaryColor: firstImage.crew.club?.secondaryColor || '#f9a8d4',
            }

            const coverImage = await ImageGenerationService.generateCoverImage(
              raceData,
              firstImage.template!,
              colors
            )

            const coverImagePath = path.join(process.cwd(), 'public', coverImage.imageUrl)
            const coverImageBuffer = await fs.readFile(coverImagePath)
            const coverFilename = `${clubAbbr.toLowerCase()}-crews-cover.png`
            zip.file(coverFilename, coverImageBuffer)

            // Generate ZIP filename: CLUBABBR-crews.zip
            const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
            const zipBase64 = zipBuffer.toString('base64')
            const filename = `${clubAbbr.toLowerCase()}-crews.zip`

            downloads.push({
              zipData: zipBase64,
              filename
            })
          }

          console.log('🚀 DEBUG: Returning by-club downloads:', downloads.length, 'ZIPs')
          return { downloads }
        }

        // Mode: by-club-race - Create separate ZIPs for each club+race combination
        if (input.mode === 'by-club-race') {
          const downloads = []
          const clubRaceCombinations = new Map<string, typeof savedImages>()

          // Group by club+race combination
          for (const image of savedImages) {
            const clubKey = image.crew.club?.name || image.crew.clubName || 'No Club'
            const raceKey = image.crew.raceName || 'No Race'
            const combinationKey = `${clubKey}|${raceKey}`

            if (!clubRaceCombinations.has(combinationKey)) {
              clubRaceCombinations.set(combinationKey, [])
            }
            clubRaceCombinations.get(combinationKey)!.push(image)
          }

          for (const [combinationKey, combinationImages] of clubRaceCombinations.entries()) {
            const [clubName, raceName] = combinationKey.split('|')
            const zip = new JSZip()

            // Add crew images for this club+race combination with boat names
            for (const image of combinationImages) {
              const crewImagePath = path.join(process.cwd(), 'public', image.imageUrl)
              const crewImageBuffer = await fs.readFile(crewImagePath)

              // Use boat name for filename, fall back to original filename
              const boatFilename = createBoatFilename(image.crew.boatName, image.filename)
              zip.file(boatFilename, crewImageBuffer)
            }

            // Add cover image for this specific club+race combination
            const firstImage = combinationImages[0]
            const raceData = {
              raceName,
              raceDate: firstImage.crew.raceDate || undefined,
              club: firstImage.crew.club
            }

            const colors = {
              primaryColor: firstImage.crew.club?.primaryColor || '#15803d',
              secondaryColor: firstImage.crew.club?.secondaryColor || '#f9a8d4',
            }

            const coverImage = await ImageGenerationService.generateCoverImage(
              raceData,
              firstImage.template!,
              colors
            )

            const coverImagePath = path.join(process.cwd(), 'public', coverImage.imageUrl)
            const coverImageBuffer = await fs.readFile(coverImagePath)
            const coverFilename = `${raceName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-cover.png`
            zip.file(coverFilename, coverImageBuffer)

            // Generate ZIP filename: race-CLUBABBR.zip
            const clubAbbr = generateClubAbbreviation(clubName)
            const safeRaceName = raceName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
            const zipBase64 = zipBuffer.toString('base64')
            const filename = `${safeRaceName}-${clubAbbr}.zip`

            downloads.push({
              zipData: zipBase64,
              filename
            })
          }

          console.log('🚀 DEBUG: Returning by-club-race downloads:', downloads.length, 'ZIPs')
          return { downloads }
        }

        // Mode: covers-only - Create ZIP with only cover images
        if (input.mode === 'covers-only') {
          const zip = new JSZip()

          // Generate cover for each race
          const processedRaces = new Set<string>()
          for (const image of savedImages) {
            const raceName = image.crew.raceName || 'No Race'
            if (processedRaces.has(raceName)) continue
            processedRaces.add(raceName)

            const raceData = {
              raceName,
              raceDate: image.crew.raceDate || undefined,
              club: image.crew.club
            }

            const colors = {
              primaryColor: image.crew.club?.primaryColor || '#15803d',
              secondaryColor: image.crew.club?.secondaryColor || '#f9a8d4',
            }

            const coverImage = await ImageGenerationService.generateCoverImage(
              raceData,
              image.template!,
              colors
            )

            const coverImagePath = path.join(process.cwd(), 'public', coverImage.imageUrl)
            const coverImageBuffer = await fs.readFile(coverImagePath)
            const coverFilename = `${raceName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-cover.png`
            zip.file(coverFilename, coverImageBuffer)
          }

          const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
          const zipBase64 = zipBuffer.toString('base64')
          const filename = `cover-images.zip`

          console.log('🚀 DEBUG: Returning covers-only download, filename:', filename)
          return {
            downloads: [{
              zipData: zipBase64,
              filename
            }]
          }
        }

        // Mode: images-only - Create ZIP with only crew images (no covers)
        if (input.mode === 'images-only') {
          const zip = new JSZip()

          // Add all crew images to ZIP with boat names
          for (const image of savedImages) {
            const crewImagePath = path.join(process.cwd(), 'public', image.imageUrl)
            const crewImageBuffer = await fs.readFile(crewImagePath)

            // Use boat name for filename, fall back to original filename
            const boatFilename = createBoatFilename(image.crew.boatName, image.filename)
            zip.file(boatFilename, crewImageBuffer)
          }

          const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
          const zipBase64 = zipBuffer.toString('base64')
          const filename = `crew-images.zip`

          console.log('🚀 DEBUG: Returning images-only download, filename:', filename)
          return {
            downloads: [{
              zipData: zipBase64,
              filename
            }]
          }
        }

        throw new Error(`Mode ${input.mode} not implemented`)

      } catch (error) {
        console.error('Batch download error:', error)
        throw new Error(
          `Failed to create batch download: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }),
})
