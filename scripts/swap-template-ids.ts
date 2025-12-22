import { prisma } from '../src/lib/prisma'

async function swapTemplateIds() {
  try {
    console.log('Swapping template IDs to fix click handlers...')

    // Get the templates
    const diagonalTemplate = await prisma.template.findFirst({
      where: { name: 'Diagonal Professional' }
    })

    const cornerTemplate = await prisma.template.findFirst({
      where: { name: 'Corner Brackets Modern' }
    })

    if (!diagonalTemplate || !cornerTemplate) {
      console.error('Could not find both templates')
      return
    }

    console.log('Current state:')
    console.log(`Diagonal Professional: ID ${diagonalTemplate.id}`)
    console.log(`Corner Brackets Modern: ID ${cornerTemplate.id}`)

    // Use a temporary ID to avoid unique constraint issues
    const tempId = 'temp-swap-id'

    // Step 1: Move diagonal to temp ID
    await prisma.template.update({
      where: { id: diagonalTemplate.id },
      data: { id: tempId }
    })

    // Step 2: Move corner to diagonal's old ID
    await prisma.template.update({
      where: { id: cornerTemplate.id },
      data: { id: diagonalTemplate.id }
    })

    // Step 3: Move diagonal (temp) to corner's old ID
    await prisma.template.update({
      where: { id: tempId },
      data: { id: cornerTemplate.id }
    })

    console.log('\n✅ IDs swapped:')
    console.log(`Diagonal Professional: Now has ID ${cornerTemplate.id}`)
    console.log(`Corner Brackets Modern: Now has ID ${diagonalTemplate.id}`)
    console.log('\n🎯 Template IDs fixed! Click handlers will now match the correct templates.')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

swapTemplateIds()