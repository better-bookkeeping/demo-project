import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client/client";

async function globalTeardown() {
  const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/demo_project";
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const movementPrefixes = [
      "Test Movement",
      "BW Movement",
      "Clear Input Test",
      "Confirm Delete",
      "Delete Me",
      "Listed Movement",
      "To Be Removed"
    ];

    const movementsToDelete = await prisma.movement.findMany({
      where: {
        OR: movementPrefixes.map((prefix) => ({
          name: { startsWith: prefix },
        })),
      },
      select: { id: true },
    });

    const movementIds = movementsToDelete.map((m) => m.id);

    if (movementIds.length > 0) {
      await prisma.set.deleteMany({
        where: { movementId: { in: movementIds } },
      });

      await prisma.movement.deleteMany({
        where: { id: { in: movementIds } },
      });
    }

    const usersToDelete = await prisma.user.findMany({
      where: {
        email: { startsWith: "new-user-" },
      },
      select: { id: true },
    });

    const userIds = usersToDelete.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.set.deleteMany({
        where: {
          OR: [
            { workout: { userId: { in: userIds } } },
            { movement: { userId: { in: userIds } } },
          ],
        },
      });

      await prisma.workout.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.movement.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.weight.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    const testUserEmail = process.env.E2E_TEST_USER_EMAIL;
    if (testUserEmail) {
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
        select: { id: true },
      });

      if (user) {
        await prisma.set.deleteMany({
          where: {
            OR: [
              { workout: { userId: user.id } },
              { movement: { userId: user.id } },
            ],
          },
        });

        await prisma.weight.deleteMany({ where: { userId: user.id } });
        await prisma.workout.deleteMany({ where: { userId: user.id } });
        await prisma.movement.deleteMany({ where: { userId: user.id } });

        await prisma.user.delete({ where: { id: user.id } });
      }
    }
  } catch (error) {
    console.error("[e2e-teardown] Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export default globalTeardown;
