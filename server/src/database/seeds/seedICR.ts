import { AppDataSource } from '../../config/database';
import { User, UserRole } from '../../models/User.model';
import { hashPassword } from '../../utils/password.utils';

/**
 * Seed script for ITC PROJECT / ICR accounts
 *
 * ADMIN:
 * Email: admin@itcproject.pl
 * Password: Admin123!
 *
 * ICR USERS (ICR-1 .. ICR-10):
 * Email: icr1@itcproject.pl ... icr10@itcproject.pl
 * Password: ICR123!
 */

const icrUsers = [
  {
    email: 'admin@itcproject.pl',
    password: 'Admin123!',
    first_name: 'Administrator',
    last_name: 'ICR',
    role: UserRole.ADMIN,
  },
  ...Array.from({ length: 10 }, (_, i) => ({
    email: `icr${i + 1}@itcproject.pl`,
    password: 'ICR123!',
    first_name: 'ICR',
    last_name: `${i + 1}`,
    role: UserRole.EMPLOYEE as UserRole,
  })),
];

async function seedICR() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established');
    }

    const userRepository = AppDataSource.getRepository(User);

    console.log('\n🌱 Starting ICR user seeding...\n');

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of icrUsers) {
      const existing = await userRepository.findOne({ where: { email: userData.email } });

      if (existing) {
        console.log(`⏭️  Skipping ${userData.email} - already exists`);
        skippedCount++;
        continue;
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = userRepository.create({
        email: userData.email,
        password_hash: hashedPassword,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
      });

      await userRepository.save(user);
      console.log(`✅ Created ${userData.role.padEnd(12)} | ${userData.email}`);
      createdCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ICR seeding completed!');
    console.log(`✅ Created: ${createdCount}  |  ⏭️  Skipped: ${skippedCount}`);
    console.log('='.repeat(60));
    console.log('\n📋 CREDENTIALS:');
    console.log('Admin:    admin@itcproject.pl  /  Admin123!');
    console.log('ICR 1-10: icr1@itcproject.pl   /  ICR123!');
    console.log('          icr2@itcproject.pl   /  ICR123!  ... itd.\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding ICR users:', error);
    process.exit(1);
  }
}

seedICR();
