import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create boat types - covering all common rowing boat classes
  console.log('Creating boat types...')

  const boatTypes = [
    // Sculling boats (each rower has two oars)
    { name: 'Single Scull', code: '1x', seats: 1, category: 'sculling' },
    { name: 'Double Scull', code: '2x', seats: 2, category: 'sculling' },
    { name: 'Quadruple Scull', code: '4x', seats: 4, category: 'sculling' },
    {
      name: 'Quadruple Scull with Cox',
      code: '4x+',
      seats: 5,
      category: 'sculling',
    },
    { name: 'Octuple Scull', code: '8x', seats: 8, category: 'sculling' },

    // Sweep boats (each rower has one oar)
    { name: 'Pair', code: '2-', seats: 2, category: 'sweep' },
    { name: 'Coxed Pair', code: '2+', seats: 3, category: 'sweep' },
    { name: 'Four', code: '4-', seats: 4, category: 'sweep' },
    { name: 'Coxed Four', code: '4+', seats: 5, category: 'sweep' },
    { name: 'Eight', code: '8+', seats: 9, category: 'sweep' },
  ]

  for (const boatType of boatTypes) {
    await prisma.boatType.upsert({
      where: { code: boatType.code },
      update: {},
      create: {
        ...boatType,
        metadata: {
          description: `${boatType.name} - ${boatType.seats} total seats`,
          hasCox: boatType.code.includes('+'),
          rowersOnly: boatType.code.includes('+')
            ? boatType.seats - 1
            : boatType.seats,
        },
      },
    })
  }

  console.log('✅ Created boat types')

  // Create template types and basic templates
  console.log('Creating templates...')

  const templates = [
    {
      name: 'Classic Blue',
      templateType: 'classic',
      previewUrl: '/templates/classic-blue-preview.jpg',
      metadata: {
        primaryColor: '#1e40af',
        secondaryColor: '#ffffff',
        fontFamily: 'serif',
        style: 'traditional',
      },
    },
    {
      name: 'Modern Red',
      templateType: 'modern',
      previewUrl: '/templates/modern-red-preview.jpg',
      metadata: {
        primaryColor: '#dc2626',
        secondaryColor: '#f9fafb',
        fontFamily: 'sans-serif',
        style: 'contemporary',
      },
    },
    {
      name: 'Elegant Navy',
      templateType: 'classic',
      previewUrl: '/templates/elegant-navy-preview.jpg',
      metadata: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#f8fafc',
        fontFamily: 'serif',
        style: 'formal',
      },
    },
    {
      name: 'Minimal White',
      templateType: 'minimal',
      previewUrl: '/templates/minimal-white-preview.jpg',
      metadata: {
        primaryColor: '#374151',
        secondaryColor: '#ffffff',
        fontFamily: 'sans-serif',
        style: 'clean',
      },
    },
    {
      name: 'Bold Orange',
      templateType: 'modern',
      previewUrl: '/templates/bold-orange-preview.jpg',
      metadata: {
        primaryColor: '#ea580c',
        secondaryColor: '#1f2937',
        fontFamily: 'sans-serif',
        style: 'energetic',
      },
    },
    {
      name: 'Traditional Green',
      templateType: 'classic',
      previewUrl: '/templates/traditional-green-preview.jpg',
      metadata: {
        primaryColor: '#059669',
        secondaryColor: '#ecfdf5',
        fontFamily: 'serif',
        style: 'heritage',
      },
    },
  ]

  for (const template of templates) {
    const existing = await prisma.template.findFirst({
      where: { name: template.name },
    })

    if (!existing) {
      await prisma.template.create({
        data: template,
      })
    }
  }

  console.log('✅ Created templates')

  // Create a sample user for development
  console.log('Creating sample user...')

  const sampleUser = await prisma.user.upsert({
    where: { email: 'demo@rowing-club.com' },
    update: {},
    create: {
      email: 'demo@rowing-club.com',
      name: 'Demo Rower',
      preferences: {
        defaultClub: 'Sample Rowing Club',
        favoriteTemplateType: 'classic',
      },
    },
  })

  console.log('✅ Created sample user')

  // Create sample clubs
  console.log('Creating sample clubs...')

  const sampleClubs = [
    {
      name: 'Sample Rowing Club',
      primaryColor: '#1e40af', // Blue
      secondaryColor: '#ffffff', // White
      userId: sampleUser.id,
    },
    {
      name: 'Thames Rowing Club',
      primaryColor: '#dc2626', // Red
      secondaryColor: '#fbbf24', // Gold
      userId: sampleUser.id,
    },
    {
      name: 'Cambridge University Boat Club',
      primaryColor: '#7dd3fc', // Light Blue
      secondaryColor: '#1e3a8a', // Navy
      userId: sampleUser.id,
    },
  ]

  const createdClubs = []
  for (const club of sampleClubs) {
    const existing = await prisma.club.findFirst({
      where: { name: club.name, userId: club.userId },
    })

    if (!existing) {
      const newClub = await prisma.club.create({
        data: club,
      })
      createdClubs.push(newClub)
    }
  }

  console.log('✅ Created sample clubs')

  // Create a sample crew
  console.log('Creating sample crew...')

  const eightBoatType = await prisma.boatType.findFirst({
    where: { code: '8+' },
  })

  if (eightBoatType) {
    const existingCrew = await prisma.crew.findFirst({
      where: { name: 'Sample Eight', userId: sampleUser.id },
    })

    const sampleClub = await prisma.club.findFirst({
      where: { name: 'Sample Rowing Club', userId: sampleUser.id },
    })

    if (!existingCrew) {
      await prisma.crew.create({
        data: {
          name: 'Sample Eight',
          clubId: sampleClub?.id, // Use club reference
          raceName: 'Head of the River',
          boatName: 'Thunder',
          coachName: 'Coach Smith',
          crewNames: [
            'Alice Johnson', // Bow (1)
            'Bob Wilson', // 2
            'Charlie Brown', // 3
            'Diana Prince', // 4
            'Edward Norton', // 5
            'Fiona Green', // 6
            'George Lucas', // 7
            'Helen Troy', // Stroke (8)
            'Ian Cox', // Coxswain
          ],
          boatTypeId: eightBoatType.id,
          userId: sampleUser.id,
        },
      })
    }
  }

  console.log('✅ Created sample crew')

  const counts = {
    boatTypes: await prisma.boatType.count(),
    templates: await prisma.template.count(),
    users: await prisma.user.count(),
    clubs: await prisma.club.count(),
    crews: await prisma.crew.count(),
  }

  console.log('\n🎉 Database seeded successfully!')
  console.log(
    `📊 Created: ${counts.boatTypes} boat types, ${counts.templates} templates, ${counts.clubs} clubs, ${counts.users} users, ${counts.crews} crews`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
