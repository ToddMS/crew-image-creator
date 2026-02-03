import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'todd.sandler@gmail.com' },
    update: {},
    create: {
      email: 'todd.sandler@gmail.com',
      name: 'Todd Sandler',
      image: 'https://ui-avatars.com/api/?name=Todd+Sandler&background=2563eb&color=fff'
    }
  });

  console.log('Created user:', user);

  // Create some test clubs
  const club1 = await prisma.club.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Oxford University Boat Club',
      primaryColor: '#0f172a',
      secondaryColor: '#e2e8f0',
      userId: user.id
    }
  });

  const club2 = await prisma.club.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Cambridge University Boat Club',
      primaryColor: '#1e40af',
      secondaryColor: '#dbeafe',
      userId: user.id
    }
  });

  console.log('Created clubs:', [club1, club2]);

  // Create boat types
  const boat8 = await prisma.boatType.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Eight',
      code: '8+',
      seats: 8,
      hasCox: true
    }
  });

  const boat4 = await prisma.boatType.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Four',
      code: '4+',
      seats: 4,
      hasCox: true
    }
  });

  console.log('Created boat types:', [boat8, boat4]);

  // Create a test crew
  const crew = await prisma.crew.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Oxford Blue Boat',
      category: 'Senior',
      gender: 'M',
      level: 'Open',
      userId: user.id,
      clubId: club1.id,
      boatTypeId: boat8.id,
      crewMembers: {
        create: [
          { name: 'John Smith', position: 'Stroke', seat: 8 },
          { name: 'James Wilson', position: '7', seat: 7 },
          { name: 'Robert Brown', position: '6', seat: 6 },
          { name: 'Michael Davis', position: '5', seat: 5 },
          { name: 'William Miller', position: '4', seat: 4 },
          { name: 'David Garcia', position: '3', seat: 3 },
          { name: 'Richard Rodriguez', position: '2', seat: 2 },
          { name: 'Christopher Martinez', position: 'Bow', seat: 1 },
          { name: 'Sarah Johnson', position: 'Cox', seat: 0 }
        ]
      }
    }
  });

  console.log('Created crew:', crew);

  console.log('✅ Database seeded successfully!');
  console.log('📧 Email: todd.sandler@gmail.com');
  console.log('🔑 Password: Use Google OAuth to sign in');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });