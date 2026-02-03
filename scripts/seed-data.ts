import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Boat Types Data
const boatTypes = [
  // Sculling boats
  {
    name: 'Single Scull',
    code: '1x',
    seats: 1,
    category: 'sculling',
    metadata: { description: 'Single rower with two oars' },
  },
  {
    name: 'Double Scull',
    code: '2x',
    seats: 2,
    category: 'sculling',
    metadata: { description: 'Two rowers, each with two oars' },
  },
  {
    name: 'Quadruple Scull',
    code: '4x',
    seats: 4,
    category: 'sculling',
    metadata: { description: 'Four rowers, each with two oars' },
  },
  {
    name: 'Quadruple Scull (Coxed)',
    code: '4x+',
    seats: 4,
    category: 'sculling',
    metadata: { description: 'Four rowers with coxswain', cox: true },
  },

  // Sweep boats
  {
    name: 'Pair',
    code: '2-',
    seats: 2,
    category: 'sweep',
    metadata: { description: 'Two rowers, each with one oar' },
  },
  {
    name: 'Coxed Pair',
    code: '2+',
    seats: 2,
    category: 'sweep',
    metadata: { description: 'Two rowers with coxswain', cox: true },
  },
  {
    name: 'Four',
    code: '4-',
    seats: 4,
    category: 'sweep',
    metadata: { description: 'Four rowers, each with one oar' },
  },
  {
    name: 'Coxed Four',
    code: '4+',
    seats: 4,
    category: 'sweep',
    metadata: { description: 'Four rowers with coxswain', cox: true },
  },
  {
    name: 'Eight',
    code: '8+',
    seats: 8,
    category: 'sweep',
    metadata: { description: 'Eight rowers with coxswain', cox: true },
  },
]

// London Rowing Clubs Data
const londonClubs = [
  {
    name: 'Leander Club',
    primaryColor: '#FF69B4',
    secondaryColor: '#FFFFFF',
    logoUrl: null,
  },
  {
    name: 'London Rowing Club',
    primaryColor: '#800080',
    secondaryColor: '#FFFFFF',
    logoUrl: null,
  },
  {
    name: 'Thames Rowing Club',
    primaryColor: '#0000FF',
    secondaryColor: '#FFFFFF',
    logoUrl: null,
  },
  {
    name: 'Putney Town Rowing Club',
    primaryColor: '#008000',
    secondaryColor: '#FFFFFF',
    logoUrl: null,
  },
  {
    name: 'Tideway Scullers School',
    primaryColor: '#FFD700',
    secondaryColor: '#000000',
    logoUrl: null,
  },
  {
    name: 'Furnivall Sculling Club',
    primaryColor: '#DC143C',
    secondaryColor: '#FFFFFF',
    logoUrl: null,
  },
  {
    name: 'Vesta Rowing Club',
    primaryColor: '#4B0082',
    secondaryColor: '#FFFFFF',
    logoUrl: null,
  },
  {
    name: 'Imperial College Boat Club',
    primaryColor: '#003366',
    secondaryColor: '#FFFFFF',
    logoUrl: null,
  },
  {
    name: 'Kings College London Boat Club',
    primaryColor: '#8B0000',
    secondaryColor: '#FFFFFF',
    logoUrl: null,
  },
  {
    name: 'Quintin Boat Club',
    primaryColor: '#FF4500',
    secondaryColor: '#FFFFFF',
    logoUrl: null,
  },
]

// Crew Names Data
const crewData = [
  // Men's crews
  {
    boatCode: '8+',
    crews: [
      { name: "Senior Men's Eight", raceType: 'Senior', gender: 'Men' },
      { name: "Junior Men's Eight", raceType: 'Junior', gender: 'Men' },
      { name: "Masters Men's Eight", raceType: 'Masters', gender: 'Men' },
      {
        name: "Development Men's Eight",
        raceType: 'Development',
        gender: 'Men',
      },
    ],
  },
  {
    boatCode: '4-',
    crews: [
      { name: "Senior Men's Four", raceType: 'Senior', gender: 'Men' },
      { name: "Junior Men's Four", raceType: 'Junior', gender: 'Men' },
      { name: "Masters Men's Four", raceType: 'Masters', gender: 'Men' },
    ],
  },
  {
    boatCode: '4+',
    crews: [
      { name: "Senior Men's Coxed Four", raceType: 'Senior', gender: 'Men' },
      { name: "Junior Men's Coxed Four", raceType: 'Junior', gender: 'Men' },
    ],
  },
  {
    boatCode: '2-',
    crews: [
      { name: "Senior Men's Pair", raceType: 'Senior', gender: 'Men' },
      { name: "Junior Men's Pair", raceType: 'Junior', gender: 'Men' },
    ],
  },
  {
    boatCode: '4x',
    crews: [
      { name: "Senior Men's Quad", raceType: 'Senior', gender: 'Men' },
      { name: "Junior Men's Quad", raceType: 'Junior', gender: 'Men' },
    ],
  },
  {
    boatCode: '2x',
    crews: [
      { name: "Senior Men's Double", raceType: 'Senior', gender: 'Men' },
      { name: "Junior Men's Double", raceType: 'Junior', gender: 'Men' },
    ],
  },
  {
    boatCode: '1x',
    crews: [
      { name: "Senior Men's Single", raceType: 'Senior', gender: 'Men' },
      { name: "Junior Men's Single", raceType: 'Junior', gender: 'Men' },
    ],
  },
  // Women's crews
  {
    boatCode: '8+',
    crews: [
      { name: "Senior Women's Eight", raceType: 'Senior', gender: 'Women' },
      { name: "Junior Women's Eight", raceType: 'Junior', gender: 'Women' },
      { name: "Masters Women's Eight", raceType: 'Masters', gender: 'Women' },
    ],
  },
  {
    boatCode: '4-',
    crews: [
      { name: "Senior Women's Four", raceType: 'Senior', gender: 'Women' },
      { name: "Junior Women's Four", raceType: 'Junior', gender: 'Women' },
    ],
  },
  {
    boatCode: '4+',
    crews: [
      {
        name: "Senior Women's Coxed Four",
        raceType: 'Senior',
        gender: 'Women',
      },
    ],
  },
  {
    boatCode: '2-',
    crews: [
      { name: "Senior Women's Pair", raceType: 'Senior', gender: 'Women' },
    ],
  },
  {
    boatCode: '4x',
    crews: [
      { name: "Senior Women's Quad", raceType: 'Senior', gender: 'Women' },
      { name: "Junior Women's Quad", raceType: 'Junior', gender: 'Women' },
    ],
  },
  {
    boatCode: '2x',
    crews: [
      { name: "Senior Women's Double", raceType: 'Senior', gender: 'Women' },
    ],
  },
  {
    boatCode: '1x',
    crews: [
      { name: "Senior Women's Single", raceType: 'Senior', gender: 'Women' },
    ],
  },
]

// Sample rower names
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
  'Edward Lewis',
  'Benjamin Harris',
  'Frederick Walker',
  'Arthur Young',
  'Samuel King',
  'Daniel Wright',
  'Matthew Lopez',
  'Christopher Hill',
  'Nicholas Green',
  'Jonathan Adams',
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
  'Elizabeth Harris',
  'Sofia Walker',
  'Avery Young',
  'Ella King',
  'Scarlett Wright',
  'Victoria Lopez',
  'Madison Hill',
  'Grace Green',
  'Chloe Adams',
  'Penelope Baker',
]

const coxNames = [
  'Alex Morgan',
  'Jordan Stevens',
  'Riley Parker',
  'Casey Mitchell',
  'Drew Campbell',
  'Avery Richardson',
  'Quinn Cooper',
  'Cameron Reed',
  'Blake Foster',
  'Sage Kelly',
]

const coachNames = [
  'Coach Sarah Williams',
  'Coach Michael Brown',
  'Coach David Johnson',
  'Coach Lisa Davis',
  'Coach Robert Wilson',
  'Coach Jennifer Miller',
  'Coach Christopher Anderson',
  'Coach Michelle Taylor',
  'Coach Andrew Clark',
  'Coach Amanda Lewis',
  'Coach Matthew Harris',
  'Coach Rebecca Walker',
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
  'Championship Challenger',
  'Victory Vessel',
  'Olympic Dream',
  'Henley Hurricane',
  'Thames Tornado',
  'London Legend',
  'River Racer',
  'Putney Power',
  'Tideway Titan',
  'Regatta Rocket',
  'Championship Charger',
  'Victory Voyager',
]

function getRandomNames(nameArray: Array<string>, count: number): Array<string> {
  const shuffled = [...nameArray].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function getRandomItem<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function main() {
  console.log('🚣 Starting to seed rowing data...')

  // Get the first user (assuming you have one from OAuth)
  const firstUser = await prisma.user.findFirst()
  if (!firstUser) {
    console.log('❌ No user found. Please sign in first.')
    return
  }

  console.log(`👤 Using user: ${firstUser.name} (${firstUser.email})`)

  // 1. Create boat types
  console.log('🛶 Creating boat types...')
  for (const boatType of boatTypes) {
    await prisma.boatType.upsert({
      where: { code: boatType.code },
      update: boatType,
      create: boatType,
    })
  }
  console.log(`✅ Created ${boatTypes.length} boat types`)

  // 2. Create clubs
  console.log('🏛️ Creating rowing clubs...')
  const createdClubs = []
  for (const club of londonClubs) {
    const createdClub = await prisma.club.upsert({
      where: {
        userId_name: {
          userId: firstUser.id,
          name: club.name,
        },
      },
      update: club,
      create: {
        ...club,
        userId: firstUser.id,
      },
    })
    createdClubs.push(createdClub)
  }
  console.log(`✅ Created ${createdClubs.length} rowing clubs`)

  // 3. Get all boat types from DB
  const allBoatTypes = await prisma.boatType.findMany()

  // 4. Create crews for each club and boat type combination
  console.log('🚣‍♀️ Creating crews...')
  let crewCount = 0

  for (const club of createdClubs) {
    for (const crewGroup of crewData) {
      const boatType = allBoatTypes.find((bt) => bt.code === crewGroup.boatCode)
      if (!boatType) continue

      for (const crewTemplate of crewGroup.crews) {
        const seats = boatType.seats
        const hasCox = boatType.code.includes('+')

        // Generate crew member names
        const namePool = crewTemplate.gender === 'Men' ? maleNames : femaleNames
        const crewMembers = getRandomNames(namePool, seats)

        // Add cox if needed
        if (hasCox) {
          crewMembers.push(`Cox: ${getRandomItem(coxNames)}`)
        }

        await prisma.crew.create({
          data: {
            name: crewTemplate.name,
            clubName: club.name,
            raceName: `${getRandomItem(['Head of the River', 'Henley Royal Regatta', 'National Championships', 'Schools Head', 'Veterans Head', 'Tideway Head'])}`,
            boatName: getRandomItem(boatNames),
            coachName: getRandomItem(coachNames),
            crewNames: crewMembers,
            boatTypeId: boatType.id,
            userId: firstUser.id,
            clubId: club.id,
          },
        })
        crewCount++
      }
    }
  }

  console.log(`✅ Created ${crewCount} crews`)
  console.log('🎉 Seeding completed successfully!')

  // Print summary
  const summary = await prisma.$transaction([
    prisma.boatType.count(),
    prisma.club.count(),
    prisma.crew.count(),
  ])

  console.log('\n📊 Database Summary:')
  console.log(`   Boat Types: ${summary[0]}`)
  console.log(`   Clubs: ${summary[1]}`)
  console.log(`   Crews: ${summary[2]}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
