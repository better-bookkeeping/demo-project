import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client/client";
import { DATABASE_URL } from "../../config/database";

let _prismaClient: PrismaClient | null = null;

export function getTestPrismaClient(): PrismaClient {
  if (!_prismaClient) {
    const adapter = new PrismaPg({ connectionString: DATABASE_URL });
    _prismaClient = new PrismaClient({ adapter });
  }
  return _prismaClient;
}

export async function cleanupTestUser(email: string): Promise<void> {
  const prisma = getTestPrismaClient();

  // Always clean up login attempts for the email
  await prisma.loginAttempt.deleteMany({
    where: { email: email.toLowerCase() },
  });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  // Delete sets first to satisfy Movement's onDelete: Restrict constraint
  await prisma.set.deleteMany({ where: { movement: { userId: user.id } } });

  // Delete food entries (before user cascade)
  await prisma.foodEntry.deleteMany({ where: { userId: user.id } });

  // Now delete user - cascades handle workouts, movements, weightEntries
  await prisma.user.delete({ where: { id: user.id } });
}

export async function cleanupAllMovements(): Promise<void> {
  const prisma = getTestPrismaClient();

  await prisma.set.deleteMany({});
  await prisma.movement.deleteMany({});
}

export async function clearLoginAttempts(email: string): Promise<void> {
  const prisma = getTestPrismaClient();
  await prisma.loginAttempt.deleteMany({
    where: { email: email.toLowerCase() },
  });
}

export async function disconnectDb(): Promise<void> {
  if (_prismaClient) {
    await _prismaClient.$disconnect();
    _prismaClient = null;
  }
}
