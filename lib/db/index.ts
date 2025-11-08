import { PrismaClient } from '@prisma/client';
import logger from '@/lib/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connect to database
export async function connectDb() {
  try {
    await prisma.$connect();
    logger.info('Connected to MongoDB via Prisma');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// Disconnect from database
export async function disconnectDb() {
  try {
    await prisma.$disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Failed to disconnect from MongoDB', { error });
  }
}

// Re-export Prisma types
export * from '@prisma/client';
