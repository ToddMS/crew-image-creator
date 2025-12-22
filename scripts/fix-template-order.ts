import { prisma } from '../src/lib/prisma'

async function fixTemplateOrder() {
  try {
    console.log('Fixing template order...')

    // Get current templates
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'asc' }
    })

    console.log('Current template order:')
    templates.forEach((t, i) => {
      console.log(`${i + 1}. ${t.name} (${t.id}) - created: ${t.createdAt}`)
    })

    if (templates.length >= 2) {
      const diagonalTemplate = templates.find(t => t.name === 'Diagonal Professional')
      const cornerTemplate = templates.find(t => t.name === 'Corner Brackets Modern')

      if (diagonalTemplate && cornerTemplate) {
        // Make Diagonal Professional have an earlier createdAt than Corner Brackets Modern
        const earlierDate = new Date(Date.now() - 1000000) // 1 second earlier
        const laterDate = new Date()

        await prisma.template.update({
          where: { id: diagonalTemplate.id },
          data: { createdAt: earlierDate }
        })

        await prisma.template.update({
          where: { id: cornerTemplate.id },
          data: { createdAt: laterDate }
        })

        console.log('\n✅ Updated template order:')
        console.log(`1. Diagonal Professional (${diagonalTemplate.id}) - ${earlierDate}`)
        console.log(`2. Corner Brackets Modern (${cornerTemplate.id}) - ${laterDate}`)
      }
    }

    console.log('\n🎯 Template order fixed! Now "Diagonal Professional" will be first.')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTemplateOrder()