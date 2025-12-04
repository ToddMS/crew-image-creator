import { prisma } from '../src/lib/prisma'

async function removeTemplates() {
  console.log('🗑️ Removing templates...')

  try {
    // Remove 'Professional Rowing Layout' and 'Dynamic Crew Program'
    const templatesToRemove = ['Professional Rowing Layout', 'Dynamic Crew Program']

    for (const templateName of templatesToRemove) {
      // First, find any saved images using this template
      const template = await prisma.template.findFirst({
        where: { name: templateName }
      })

      if (template) {
        // Delete any saved images using this template
        const deletedImages = await prisma.savedImage.deleteMany({
          where: { templateId: template.id }
        })

        console.log(`📸 Deleted ${deletedImages.count} images for template: ${templateName}`)

        // Delete the template
        await prisma.template.delete({
          where: { id: template.id }
        })

        console.log(`✅ Deleted template: ${templateName}`)
      } else {
        console.log(`⚠️ Template not found: ${templateName}`)
      }
    }

    // Show remaining templates
    console.log('\n📋 Remaining templates:')
    const remainingTemplates = await prisma.template.findMany({
      orderBy: { name: 'asc' }
    })

    remainingTemplates.forEach((t, index) => {
      console.log(`${index + 1}. ${t.name} (${t.templateType}) - ${t.isActive ? 'Active' : 'Inactive'}`)
    })

    console.log(`\n🎉 Template cleanup complete! ${remainingTemplates.length} templates remaining.`)

  } catch (error) {
    console.error('❌ Error removing templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeTemplates()