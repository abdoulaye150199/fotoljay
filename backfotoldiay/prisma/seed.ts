import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@fotoldiay.com' },
    update: {},
    create: {
      email: 'admin@fotoldiay.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      displayName: 'Administrateur',
    },
  });

  // Create moderator user
  const modPassword = await bcrypt.hash('mod123', 10);
  await prisma.user.upsert({
    where: { email: 'mod@fotoljay.com' },
    update: {},
    create: {
      email: 'mod@fotoljay.com',
      passwordHash: modPassword,
      role: 'MODERATEUR',
      displayName: 'Modérateur',
    },
  });

  // Create vendor user
  const vendorPassword = await bcrypt.hash('vendeur123', 10);
  await prisma.user.upsert({
    where: { email: 'vendeur@fotoljay.com' },
    update: {},
    create: {
      email: 'vendeur@fotoljay.com',
      passwordHash: vendorPassword,
      role: 'VENDEUR',
      displayName: 'Vendeur',
    },
  });

  console.log('Seed completed: Admin, Moderator and Vendor accounts created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });