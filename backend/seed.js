const prisma = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = await prisma.user.upsert({
            where: { email: 'admin@system.com' },
            update: {},
            create: {
                email: 'admin@system.com',
                password: hashedPassword,
                role: 'ADMIN',
            },
        });

        console.log('Seeding complete! Admin user established.');
        console.log('Admin Email: admin@system.com');
    } catch (e) {
        console.log('SEED ERROR:', e.message || e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
