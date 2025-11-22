import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚣 Creating 20 crews (2 per club)...')

  // Get the first user
  const firstUser = await prisma.user.findFirst()
  if (!firstUser) {
    console.log('❌ No user found. Please sign in first.')
    return
  }

  // Get all clubs and boat types
  const clubs = await prisma.club.findMany()
  const boatTypes = await prisma.boatType.findMany()

  if (clubs.length === 0) {
    console.log('❌ No clubs found. Please run the main seed script first.')
    return
  }

  if (boatTypes.length === 0) {
    console.log(
      '❌ No boat types found. Please run the main seed script first.',
    )
    return
  }

  // Create exactly 20 crews (2 per club)
  const crewsToCreate = [
    // Club 1 - Leander Club
    {
      clubId: clubs[0].id,
      boatTypeId: boatTypes[8].id,
      name: 'Leander Elite VIII',
    },
    {
      clubId: clubs[0].id,
      boatTypeId: boatTypes[0].id,
      name: 'Leander Sculling Squad',
    },

    // Club 2 - London Rowing Club
    { clubId: clubs[1].id, boatTypeId: boatTypes[8].id, name: 'LRC 1st VIII' },
    {
      clubId: clubs[1].id,
      boatTypeId: boatTypes[2].id,
      name: 'LRC Development 4x',
    },

    // Club 3 - Thames Rowing Club
    {
      clubId: clubs[2].id,
      boatTypeId: boatTypes[8].id,
      name: 'Thames 1st VIII',
    },
    {
      clubId: clubs[2].id,
      boatTypeId: boatTypes[1].id,
      name: 'Thames Masters 2x',
    },

    // Club 4 - Putney Town Rowing Club
    {
      clubId: clubs[3].id,
      boatTypeId: boatTypes[8].id,
      name: 'Putney Senior VIII',
    },
    {
      clubId: clubs[3].id,
      boatTypeId: boatTypes[6].id,
      name: 'Putney Development IV',
    },

    // Club 5 - Tideway Scullers School
    {
      clubId: clubs[4].id,
      boatTypeId: boatTypes[0].id,
      name: 'Tideway Elite 1x',
    },
    {
      clubId: clubs[4].id,
      boatTypeId: boatTypes[1].id,
      name: 'Tideway Senior 2x',
    },

    // Club 6 - Furnivall Sculling Club
    {
      clubId: clubs[5].id,
      boatTypeId: boatTypes[0].id,
      name: 'Furnivall Elite 1x',
    },
    {
      clubId: clubs[5].id,
      boatTypeId: boatTypes[2].id,
      name: 'Furnivall 4x Squad',
    },

    // Club 7 - Vesta Rowing Club
    {
      clubId: clubs[6].id,
      boatTypeId: boatTypes[8].id,
      name: 'Vesta 1st VIII',
    },
    {
      clubId: clubs[6].id,
      boatTypeId: boatTypes[4].id,
      name: 'Vesta Elite Pair',
    },

    // Club 8 - Imperial College Boat Club
    {
      clubId: clubs[7].id,
      boatTypeId: boatTypes[8].id,
      name: 'Imperial 1st VIII',
    },
    {
      clubId: clubs[7].id,
      boatTypeId: boatTypes[6].id,
      name: 'Imperial Development IV',
    },

    // Club 9 - Kings College London Boat Club
    {
      clubId: clubs[8].id,
      boatTypeId: boatTypes[8].id,
      name: 'KCL Senior VIII',
    },
    { clubId: clubs[8].id, boatTypeId: boatTypes[1].id, name: 'KCL Elite 2x' },

    // Club 10 - Quintin Boat Club
    {
      clubId: clubs[9].id,
      boatTypeId: boatTypes[8].id,
      name: 'Quintin 1st VIII',
    },
    {
      clubId: clubs[9].id,
      boatTypeId: boatTypes[0].id,
      name: 'Quintin Elite 1x',
    },
  ]

  // Sample data
  const raceNames = [
    'Head of the River Race',
    'Henley Royal Regatta',
    'National Championships',
    'Schools Head',
    'Veterans Head',
    'Tideway Head',
  ]

  const boatNames = [
    'Spirit of Thames',
    'Henley Hero',
    'Putney Pride',
    'Thames Warrior',
    'London Lightning',
    'River Rocket',
    'Tideway Thunder',
    'Regatta Runner',
  ]

  const coachNames = [
    'Coach Sarah Williams',
    'Coach Michael Brown',
    'Coach David Johnson',
    'Coach Lisa Davis',
    'Coach Robert Wilson',
    'Coach Jennifer Miller',
  ]

  const maleNames = [
    'James Thompson',
    'Oliver Smith',
    'Harry Wilson',
    'George Brown',
    'Charlie Davis',
    'William Jones',
    'Thomas Miller',
    'Jack Anderson',
    'Alexander Taylor',
    'Henry Clark',
  ]

  const femaleNames = [
    'Emma Johnson',
    'Olivia Williams',
    'Sophia Brown',
    'Isabella Davis',
    'Charlotte Wilson',
    'Amelia Miller',
    'Harper Anderson',
    'Evelyn Taylor',
    'Abigail Clark',
    'Emily Lewis',
  ]

  const coxNames = [
    'Alex Morgan',
    'Jordan Stevens',
    'Riley Parker',
    'Casey Mitchell',
    'Drew Campbell',
  ]

  function getRandomItem<T>(array: Array<T>): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  function getRandomNames(nameArray: Array<string>, count: number): Array<string> {
    const shuffled = [...nameArray].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  // Create all 20 crews
  for (let i = 0; i < crewsToCreate.length; i++) {
    const crewData = crewsToCreate[i]
    const club = clubs.find((c) => c.id === crewData.clubId)
    const boatType = boatTypes.find((bt) => bt.id === crewData.boatTypeId)

    if (!club || !boatType) continue

    const seats = boatType.seats
    const hasCox = boatType.code.includes('+')

    // Generate crew member names (alternating between male/female crews)
    const isFemale = i % 3 === 1 // Every 3rd crew is female
    const namePool = isFemale ? femaleNames : maleNames
    const crewMembers = getRandomNames(namePool, seats)

    // Add cox if needed
    if (hasCox) {
      crewMembers.push(`Cox: ${getRandomItem(coxNames)}`)
    }

    await prisma.crew.create({
      data: {
        name: crewData.name,
        clubName: club.name,
        raceName: getRandomItem(raceNames),
        boatName: getRandomItem(boatNames),
        coachName: getRandomItem(coachNames),
        crewNames: crewMembers,
        boatTypeId: boatType.id,
        userId: firstUser.id,
        clubId: club.id,
      },
    })

    console.log(`✅ Created crew ${i + 1}/20: ${crewData.name}`)
  }

  console.log('🎉 Successfully created exactly 20 crews!')

  // Print summary
  const totalCrews = await prisma.crew.count()
  console.log(`📊 Total crews in database: ${totalCrews}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding crews:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
