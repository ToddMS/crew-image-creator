import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎨 Replacing templates with custom designs...')

  // Get the first user
  const firstUser = await prisma.user.findFirst()
  if (!firstUser) {
    console.log('❌ No user found. Please sign in first.')
    return
  }

  // Delete all existing templates
  await prisma.template.deleteMany({})
  console.log('🗑️ Removed all existing templates')

  // Create the 2 new templates based on visual analysis
  const templates = [
    {
      name: 'Classic Program',
      templateType: 'program',
      previewUrl: '/template-previews/template-1.svg',
      metadata: {
        primaryColor: '#094E2A', // Dark green from the text
        secondaryColor: '#FFFFFF', // White background
        style: 'traditional',
        description: 'Classic rowing program layout with formal typography',
      },
    },
    {
      name: 'Modern Geometric',
      templateType: 'poster',
      previewUrl: '/template-previews/template-2.svg',
      metadata: {
        primaryColor: '#094E2A', // Dark green
        secondaryColor: '#F3BFD4', // Pink accent color
        style: 'geometric',
        description: 'Modern design with geometric shapes and oar motif',
      },
    },
  ]

  // Create the new templates
  for (const template of templates) {
    await prisma.template.create({
      data: template,
    })
    console.log(`✅ Created template: ${template.name}`)
  }

  console.log('🎉 Successfully replaced templates!')

  // Print summary
  const totalTemplates = await prisma.template.count()
  console.log(`📊 Total templates in database: ${totalTemplates}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
