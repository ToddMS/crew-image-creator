import { prisma } from '../src/lib/prisma'

async function checkTemplates() {
  console.log('📋 All templates in database:')

  try {
    const templates = await prisma.template.findMany({
      orderBy: { name: 'asc' }
    })

    if (templates.length === 0) {
      console.log('No templates found.')
    } else {
      templates.forEach((t, index) => {
        console.log(`${index + 1}. Name: "${t.name}", Type: ${t.templateType}, Active: ${t.isActive}, ID: ${t.id}`)
      })
    }

    console.log(`\nTotal: ${templates.length} template(s)`)

  } catch (error) {
    console.error('❌ Error checking templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTemplates()