import { FullConfig } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client/client";
import argon2 from "argon2";

async function globalSetup(config: FullConfig) {
  const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/demo_project";
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const timestamp = Date.now();
    const testUserEmail = `e2e-test-${timestamp}@example.com`;
    const testUserName = `E2E Test ${timestamp}`;
    const testUserPassword = "testpass123";

    const existingUser = await prisma.user.findUnique({
      where: { email: testUserEmail },
    });

    if (!existingUser) {
      const passwordHash = await argon2.hash(testUserPassword);
      await prisma.user.create({
        data: {
          email: testUserEmail,
          name: testUserName,
          passwordHash,
        },
      });
    }

    process.env.E2E_TEST_USER_EMAIL = testUserEmail;
    process.env.E2E_TEST_USER_PASSWORD = testUserPassword;
    process.env.E2E_TEST_USER_NAME = testUserName;
  } catch (error) {
    console.error("[e2e-setup] Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
