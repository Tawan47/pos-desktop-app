import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  console.log('Connecting to database...');
  try {
    await prisma.$connect();
    console.log('Connected successfully!');
    const products = await prisma.product.findMany({ take: 1 });
    console.log('Fetch test:', products);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
