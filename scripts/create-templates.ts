import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTemplates() {
  console.log('🎨 Creating template records from actual template files...')

  // Check if templates already exist
  const existingTemplate1 = await prisma.template.findFirst({
    where: { name: 'Diagonal Professional' }
  })

  const existingTemplate2 = await prisma.template.findFirst({
    where: { name: 'Corner Brackets Modern' }
  })

  let template1, template2

  // Template 1: Diagonal Design (Green/Pink)
  if (!existingTemplate1) {
    template1 = await prisma.template.create({
      data: {
        name: 'Diagonal Professional',
        templateType: 'diagonal',
        previewUrl: '/templates/previews/template-1.svg',
        metadata: {
          htmlFile: '/templates/template1/template1.html',
          cssFile: '/templates/template1/template1.css',
          primaryColor: '#15803d', // Green
          secondaryColor: '#f3bfd4', // Pink
          style: 'diagonal-split',
          description: 'Professional diagonal layout with green and pink color scheme',
          features: ['Diagonal background split', 'Boat image centered', 'Club logo bottom-right', 'Border design'],
          dimensions: { width: 1080, height: 1080 }
        }
      },
    })
  } else {
    template1 = existingTemplate1
  }

  // Template 2: Corner Brackets Design
  if (!existingTemplate2) {
    template2 = await prisma.template.create({
      data: {
        name: 'Corner Brackets Modern',
        templateType: 'brackets',
        previewUrl: '/templates/previews/template-2.svg',
        metadata: {
          htmlFile: '/templates/template2/template2.html',
          cssFile: '/templates/template2/template2.css',
          primaryColor: '#22c55e', // Green brackets
          secondaryColor: '#ec4899', // Pink brackets
          style: 'corner-brackets',
          description: 'Modern clean design with colorful corner brackets',
          features: ['Corner bracket design', 'Clean white background', 'Alternating colored corners', 'Modern typography'],
          dimensions: { width: 1080, height: 1080 }
        }
      },
    })
  } else {
    template2 = existingTemplate2
  }

  console.log('✅ Created template records:')
  console.log(`• Template 1: ${template1.name} (${template1.templateType})`)
  console.log(`• Template 2: ${template2.name} (${template2.templateType})`)

  const count = await prisma.template.count()
  console.log(`\n📊 Total templates in database: ${count}`)
}

createTemplates()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })