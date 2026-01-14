import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateBoatTypeNames() {
  console.log('🔧 Updating boat type names...')

  try {
    // Update the boat type name from "Four" to "Coxless Four" for code "4-"
    const result = await prisma.boatType.updateMany({
      where: {
        code: '4-',
        name: 'Four'  // Only update if it currently has the old name
      },
      data: {
        name: 'Coxless Four'
      }
    })

    console.log(`✅ Updated ${result.count} boat type records`)

    // Verify the update
    const updatedBoatType = await prisma.boatType.findFirst({
      where: { code: '4-' }
    })

    console.log('📊 Current 4- boat type:', updatedBoatType)

  } catch (error) {
    console.error('❌ Error updating boat type names:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateBoatTypeNames()