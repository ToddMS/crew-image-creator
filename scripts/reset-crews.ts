import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetCrews() {
  console.log('🗑️  Clearing all existing crews...')

  // Delete all saved images first (due to foreign key constraints)
  await prisma.savedImage.deleteMany()
  console.log('   ✅ Deleted saved images')

  // Delete all crews
  await prisma.crew.deleteMany()
  console.log('   ✅ Deleted all crews')

  console.log('\n🚣‍♀️ Creating fresh sample crew data...')

  // Get existing boat types and users
  const boatTypes = await prisma.boatType.findMany()
  const users = await prisma.user.findMany()
  const clubs = await prisma.club.findMany()

  if (users.length === 0) {
    console.log('❌ No users found. Please create a user first.')
    return
  }

  const user = users[0]
  console.log(`   Using user: ${user.name} (${user.email})`)

  // Sample crew data with race categories
  const sampleCrews = [
    {
      name: "Oxford University Boat Club",
      clubName: "Oxford University BC",
      raceName: "The Boat Race 2024",
      raceCategory: "Final A",
      boatName: "Isis",
      coachName: "Sean Bowden",
      category: "M1 Senior Men",
      crewNames: ["James Smith", "Michael Johnson", "David Wilson", "Robert Brown", "William Davis", "Thomas Miller", "Richard Garcia", "Christopher Rodriguez", "Matthew Martinez"],
      boatTypeId: boatTypes.find(bt => bt.code === '8+')?.id || boatTypes[0]?.id,
      userId: user.id,
      clubId: clubs.find(c => c.name.includes('Oxford'))?.id
    },
    {
      name: "Cambridge University Women",
      clubName: "Cambridge University WBC",
      raceName: "Women's Boat Race 2024",
      raceCategory: "Final A",
      boatName: "Blondie",
      coachName: "Rob Baker",
      category: "W1 Senior Women",
      crewNames: ["Emily Johnson", "Sarah Wilson", "Jessica Brown", "Amanda Davis", "Lisa Miller", "Jennifer Garcia", "Michelle Rodriguez", "Ashley Martinez", "Lauren Anderson"],
      boatTypeId: boatTypes.find(bt => bt.code === '8+')?.id || boatTypes[0]?.id,
      userId: user.id,
      clubId: clubs.find(c => c.name.includes('Cambridge'))?.id
    },
    {
      name: "Harvard Crimson Four",
      clubName: "Harvard University",
      raceName: "Head of the Charles",
      raceCategory: "Heat 3",
      boatName: "Crimson Pride",
      coachName: "Charlie Butt",
      category: "M2 Senior Men",
      crewNames: ["Alex Thompson", "Jake Wilson", "Ryan Johnson", "Kevin Brown", "Tyler Davis"],
      boatTypeId: boatTypes.find(bt => bt.code === '4+')?.id || boatTypes[0]?.id,
      userId: user.id,
      clubId: clubs[0]?.id
    },
    {
      name: "Yale Bulldogs Double",
      clubName: "Yale University",
      raceName: "Eastern Sprints",
      raceCategory: "Semi-Final B",
      boatName: "Blue Steel",
      coachName: "Andy Card",
      category: "M3 Senior Men",
      crewNames: ["Brandon Lee", "Connor White"],
      boatTypeId: boatTypes.find(bt => bt.code === '2x')?.id || boatTypes[0]?.id,
      userId: user.id,
      clubId: clubs[0]?.id
    },
    {
      name: "Princeton Tigers Single",
      clubName: "Princeton University",
      raceName: "Dad Vail Regatta",
      raceCategory: "Final H",
      boatName: "Orange Fury",
      coachName: "Greg Hughes",
      category: "M1 Senior Men",
      crewNames: ["Marcus Johnson"],
      boatTypeId: boatTypes.find(bt => bt.code === '1x')?.id || boatTypes[0]?.id,
      userId: user.id,
      clubId: clubs[0]?.id
    },
    {
      name: "Stanford Cardinals Women's Four",
      clubName: "Stanford University",
      raceName: "Pac-12 Championship",
      raceCategory: "Heat 1",
      boatName: "Cardinal Red",
      coachName: "Kate Bertko",
      category: "W1 Senior Women",
      crewNames: ["Sophia Martinez", "Isabella Garcia", "Emma Rodriguez", "Olivia Anderson", "Ava Thomas"],
      boatTypeId: boatTypes.find(bt => bt.code === '4+')?.id || boatTypes[0]?.id,
      userId: user.id,
      clubId: clubs[0]?.id
    },
    {
      name: "MIT Engineers Eight",
      clubName: "Massachusetts Institute of Technology",
      raceName: "Charles River Classic",
      raceCategory: "Final C",
      boatName: "Beaver Express",
      coachName: "Dr. Sarah Chen",
      category: "M2 Senior Men",
      crewNames: ["Andrew Kim", "Daniel Park", "Jonathan Liu", "Samuel Wang", "Benjamin Zhang", "Nicholas Chen", "Alexander Wu", "Christopher Yang", "Matthew Li"],
      boatTypeId: boatTypes.find(bt => bt.code === '8+')?.id || boatTypes[0]?.id,
      userId: user.id,
      clubId: clubs[0]?.id
    }
  ]

  console.log(`\n   Creating ${sampleCrews.length} sample crews...`)

  for (const crewData of sampleCrews) {
    if (!crewData.boatTypeId) {
      console.log(`   ⚠️  Skipping ${crewData.name} - no boat type found`)
      continue
    }

    try {
      const crew = await prisma.crew.create({
        data: crewData,
        include: {
          boatType: true,
          club: true
        }
      })
      console.log(`   ✅ Created: ${crew.name} (${crew.boatType.name}) - Race Category: ${crew.raceCategory || 'None'}`)
    } catch (error) {
      console.log(`   ❌ Failed to create ${crewData.name}:`, error.message)
    }
  }

  console.log('\n🎉 Successfully reset crews with fresh sample data!')
  console.log('\n📊 Current database summary:')

  const crewCount = await prisma.crew.count()
  const clubCount = await prisma.club.count()
  const boatTypeCount = await prisma.boatType.count()
  const userCount = await prisma.user.count()

  console.log(`   • ${crewCount} crews`)
  console.log(`   • ${clubCount} clubs`)
  console.log(`   • ${boatTypeCount} boat types`)
  console.log(`   • ${userCount} users`)
}

resetCrews()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })