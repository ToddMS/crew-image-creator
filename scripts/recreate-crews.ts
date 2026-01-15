import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function recreateCrews() {
  try {
    console.log('🗑️  Deleting all existing crews...')

    // First delete all saved images to avoid foreign key constraints
    await prisma.savedImage.deleteMany({})
    console.log('✅ Deleted all saved images')

    // Then delete all crews
    await prisma.crew.deleteMany({})
    console.log('✅ Deleted all existing crews')

    // Get data we need for creating new crews
    const boatTypes = await prisma.boatType.findMany()
    const clubs = await prisma.club.findMany()
    const users = await prisma.user.findMany()

    if (users.length === 0) {
      console.log('❌ No users found! Please create a user first.')
      return
    }

    const user = users[0] // Use first user

    console.log('🚀 Creating new crews with categories...')

    // Sample categories
    const categories = [
      'M1 Senior Men',
      'W1 Senior Women',
      'M2 Club Men',
      'W2 Club Women',
      'U23 Men',
      'U23 Women',
      'Masters Men 40+',
      'Masters Women 40+',
      'Junior Men',
      'Junior Women'
    ]

    const crews = [
      {
        name: 'Auriol Kensington Senior Eight',
        category: 'M1 Senior Men',
        boatType: '8+',
        crewNames: ['Tim Cox', 'Todd Sandler', 'Alex Thompson', 'James Wilson', 'Mike Davies', 'Ben Roberts', 'Chris Evans', 'Sam Parker', 'Matt Johnson'],
        raceName: 'Head of the River',
        boatName: 'Thunder'
      },
      {
        name: 'Leander Club Women\'s Eight',
        category: 'W1 Senior Women',
        boatType: '8+',
        crewNames: ['Sarah Cox', 'Emma Smith', 'Katie Brown', 'Lucy Davis', 'Helen Wilson', 'Amy Taylor', 'Sophie Clark', 'Chloe Walker', 'Grace Hall'],
        raceName: 'Henley Royal Regatta',
        boatName: 'Lightning'
      },
      {
        name: 'Oxford Brookes Quad',
        category: 'M2 Club Men',
        boatType: '4x',
        crewNames: ['Jack Williams', 'Tom Harris', 'Dan Mitchell', 'Ryan Cooper'],
        raceName: 'Dorney Lake Regatta'
      },
      {
        name: 'Cambridge Women\'s Four',
        category: 'W2 Club Women',
        boatType: '4-',
        crewNames: ['Olivia White', 'Jessica Green', 'Lauren Adams', 'Megan Price'],
        raceName: 'Cambridge Spring Head'
      },
      {
        name: 'Imperial College Pair',
        category: 'U23 Men',
        boatType: '2-',
        crewNames: ['David Lee', 'Mark Turner'],
        raceName: 'Metropolitan Regatta'
      },
      {
        name: 'Durham University Double',
        category: 'U23 Women',
        boatType: '2x',
        crewNames: ['Rachel Moore', 'Hannah Foster'],
        raceName: 'Durham Regatta'
      },
      {
        name: 'London RC Single Scull',
        category: null, // No category
        boatType: '1x',
        crewNames: ['Peter Stevens'],
        raceName: 'Scullers Head'
      },
      {
        name: 'Thames RC Masters Eight',
        category: 'Masters Men 40+',
        boatType: '8+',
        crewNames: ['Michael Cox', 'Robert Johnson', 'Andrew Taylor', 'Stephen Brown', 'Paul Wilson', 'Kevin Davis', 'Martin Clark', 'Graham White', 'Ian Thompson'],
        raceName: 'Masters Head',
        coachName: 'Coach Richards'
      },
      {
        name: 'Tideway Scullers Junior Quad',
        category: 'Junior Men',
        boatType: '4x',
        crewNames: ['Josh Martin', 'Connor Bell', 'Ethan Hughes', 'Noah Phillips'],
        raceName: 'Junior Sculling Head'
      },
      {
        name: 'Molesey BC Women\'s Pair',
        boatType: '2-',
        crewNames: ['Victoria Scott', 'Charlotte King'],
        raceName: 'Weybridge Ladies Regatta'
      }
    ]

    let createdCount = 0

    for (const crewData of crews) {
      try {
        // Find boat type
        const boatType = boatTypes.find(bt => bt.code === crewData.boatType)
        if (!boatType) {
          console.log(`❌ Boat type ${crewData.boatType} not found for ${crewData.name}`)
          continue
        }

        // Find a club (use first available)
        const club = clubs.find(c => crewData.name.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])) || clubs[0]

        const newCrew = await prisma.crew.create({
          data: {
            name: crewData.name,
            category: crewData.category || undefined,
            crewNames: crewData.crewNames,
            boatTypeId: boatType.id,
            userId: user.id,
            clubId: club?.id,
            raceName: crewData.raceName,
            boatName: crewData.boatName,
            coachName: crewData.coachName
          },
          include: {
            boatType: true,
            club: true
          }
        })

        createdCount++
        console.log(`✅ Created crew: ${newCrew.name} ${newCrew.category ? `(${newCrew.category})` : '(no category)'} - ${newCrew.boatType.code}`)
      } catch (error) {
        console.error(`❌ Failed to create crew ${crewData.name}:`, error)
      }
    }

    console.log(`\n🎉 Successfully created ${createdCount} new crews!`)
    console.log(`📊 Categories used: ${categories.filter(cat => crews.some(c => c.category === cat)).length} different categories`)
    console.log(`📊 Crews without category: ${crews.filter(c => !c.category).length}`)

  } catch (error) {
    console.error('❌ Error recreating crews:', error)
  } finally {
    await prisma.$disconnect()
  }
}

recreateCrews()