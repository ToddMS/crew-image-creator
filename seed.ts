import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Create a test user (you!)
    const user = await prisma.user.upsert({
      where: { email: 'todd.sandler@gmail.com' },
      update: {},
      create: {
        email: 'todd.sandler@gmail.com',
        name: 'Todd Sandler',
        image: 'https://ui-avatars.com/api/?name=Todd+Sandler&background=2563eb&color=fff'
      }
    });

    console.log('✅ Created user:', user);

    // Create some test clubs
    const club1 = await prisma.club.upsert({
      where: {
        name_userId: {
          name: 'Oxford University Boat Club',
          userId: user.id
        }
      },
      update: {},
      create: {
        name: 'Oxford University Boat Club',
        primaryColor: '#0f172a',
        secondaryColor: '#e2e8f0',
        userId: user.id
      }
    });

    const club2 = await prisma.club.upsert({
      where: {
        name_userId: {
          name: 'Cambridge University Boat Club',
          userId: user.id
        }
      },
      update: {},
      create: {
        name: 'Cambridge University Boat Club',
        primaryColor: '#1e40af',
        secondaryColor: '#dbeafe',
        userId: user.id
      }
    });

    console.log('✅ Created clubs:', [club1.name, club2.name]);

    // Create boat types
    const boat8 = await prisma.boatType.upsert({
      where: { code: '8+' },
      update: {},
      create: {
        name: 'Eight',
        code: '8+',
        seats: 8,
        hasCox: true
      }
    });

    const boat4 = await prisma.boatType.upsert({
      where: { code: '4+' },
      update: {},
      create: {
        name: 'Four',
        code: '4+',
        seats: 4,
        hasCox: true
      }
    });

    console.log('✅ Created boat types:', [boat8.code, boat4.code]);

    // Create some templates
    const template1 = await prisma.template.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Diagonal Professional',
        description: 'Professional diagonal split layout with crew positioning',
        previewUrl: '/templates/template1/preview.jpg',
        isActive: true
      }
    });

    const template2 = await prisma.template.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Corner Brackets',
        description: 'Corner L-brackets with boat and content layout',
        previewUrl: '/templates/template2/preview.jpg',
        isActive: true
      }
    });

    console.log('✅ Created templates:', [template1.name, template2.name]);

    // Create a test crew
    const crew = await prisma.crew.create({
      data: {
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
      },
      include: {
        crewMembers: true,
        club: true,
        boatType: true
      }
    });

    console.log('✅ Created crew:', crew.name, 'with', crew.crewMembers.length, 'members');

    console.log('🎉 Database seeded successfully!');
    console.log('📧 Your email: todd.sandler@gmail.com');
    console.log('🔑 Use Google OAuth to sign in');

    console.log('\n📊 Summary:');
    console.log(`- Users: 1 (${user.email})`);
    console.log(`- Clubs: 2 (${club1.name}, ${club2.name})`);
    console.log(`- Boat Types: 2 (${boat8.code}, ${boat4.code})`);
    console.log(`- Templates: 2 (${template1.name}, ${template2.name})`);
    console.log(`- Crews: 1 (${crew.name})`);
    console.log(`- Crew Members: ${crew.crewMembers.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('💥 Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('👋 Disconnected from database');
  });