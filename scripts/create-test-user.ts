import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Hash password for test user
    const hashedPassword = await bcrypt.hash('testpassword123', 12)

    const testUser = await prisma.user.upsert({
      where: { email: 'claude@test.dev' },
      update: {},
      create: {
        email: 'claude@test.dev',
        name: 'Claude Test User',
        password: hashedPassword,
        image: null,
        preferences: {
          theme: 'light',
          notifications: true,
        },
      },
    })

    console.log('✅ Test user created successfully:')
    console.log('📧 Email:', testUser.email)
    console.log('👤 Name:', testUser.name)
    console.log('🔑 Password: testpassword123')
    console.log('🆔 ID:', testUser.id)

    return testUser
  } catch (error) {
    console.error('❌ Error creating test user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
createTestUser()
  .then(() => {
    console.log('\n🎉 Test user setup complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to create test user:', error)
    process.exit(1)
  })

export { createTestUser }