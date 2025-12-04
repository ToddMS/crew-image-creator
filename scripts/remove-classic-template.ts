import { prisma } from '../src/lib/prisma'

async function removeClassicTemplate() {
  console.log('🗑️ Removing Classic Program template...')

  try {
    // Remove 'Classic Program'
    const template = await prisma.template.findFirst({
      where: { name: 'Classic Program' }
    })

    if (template) {
      // Delete any saved images using this template
      const deletedImages = await prisma.savedImage.deleteMany({
        where: { templateId: template.id }
      })

      console.log(`📸 Deleted ${deletedImages.count} images for template: Classic Program`)

      // Delete the template
      await prisma.template.delete({
        where: { id: template.id }
      })

      console.log(`✅ Deleted template: Classic Program`)
    } else {
      console.log(`⚠️ Template not found: Classic Program`)
    }

    // Show remaining templates
    console.log('\n📋 Remaining templates:')
    const remainingTemplates = await prisma.template.findMany({
      orderBy: { name: 'asc' }
    })

    remainingTemplates.forEach((t, index) => {
      console.log(`${index + 1}. ${t.name} (${t.templateType}) - ${t.isActive ? 'Active' : 'Inactive'}`)
    })

    console.log(`\n🎉 Template cleanup complete! ${remainingTemplates.length} template(s) remaining.`)

  } catch (error) {
    console.error('❌ Error removing template:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeClassicTemplate()