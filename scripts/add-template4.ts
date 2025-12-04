import { prisma } from '../src/lib/prisma'

async function addTemplate4() {
  console.log('🎨 Adding Template 4: Professional Rowing Layout...')

  try {
    const template = await prisma.template.create({
      data: {
        name: 'Professional Rowing Layout',
        templateType: 'poster',
        previewUrl: '/template-previews/template-4.svg',
        isActive: true,
        metadata: {
          description: 'Professional rowing layout inspired by Figma design',
          features: [
            'Detailed boat diagram with crew positions',
            'Individual crew member positioning',
            'Club logo integration',
            'Event branding',
            'Professional typography'
          ],
          supportsBoatTypes: ['8+', '4+', '2-', '1x', '2x', '4x'],
          version: '1.0.0'
        }
      }
    })

    console.log('✅ Template 4 created successfully:', template.name)
    console.log('📝 Template ID:', template.id)

    // Show all templates
    const allTemplates = await prisma.template.findMany({
      orderBy: { name: 'asc' }
    })

    console.log('\n📋 All available templates:')
    allTemplates.forEach((t, index) => {
      console.log(`${index + 1}. ${t.name} (${t.templateType}) - ${t.isActive ? 'Active' : 'Inactive'}`)
    })

  } catch (error) {
    console.error('❌ Error creating template:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTemplate4()