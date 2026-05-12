import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const emailArgIndex = process.argv.findIndex((arg) => arg === '--email');
const email = emailArgIndex >= 0 ? process.argv[emailArgIndex + 1] : undefined;

if (!email) {
  console.error('Usage: npm run admin:grant --prefix server -- --email admin@example.com');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.update({
    where: { email },
    data: {
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      status: true,
    },
  });

  console.log(`Granted admin role to ${user.email} (#${user.id}, ${user.username})`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Failed to grant admin role');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
