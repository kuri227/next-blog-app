const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setAdmin() {
  await prisma.user.updateMany({
    where: { email: 'demo@techsns.com' },
    data: { role: 'ADMIN' },
  });
  console.log("Role updated to ADMIN for demo@techsns.com");
}

setAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
