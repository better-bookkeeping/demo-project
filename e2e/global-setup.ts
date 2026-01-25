import { FullConfig } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client/client";
import argon2 from "argon2";
import fs from "fs";
import path from "path";
import { E2E_WORKER_COUNT, E2E_ENV_FILE } from "./config";

async function globalSetup(config: FullConfig) {
  const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/demo_project";
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const timestamp = Date.now();
    const testUserPassword = "testpass123";
    const workerEmails: string[] = [];

    for (let i = 0; i < E2E_WORKER_COUNT; i++) {
      const testUserEmail = `e2e-test-worker-${i}-${timestamp}@example.com`;
      const testUserName = `E2E Test Worker ${i}`;

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

      workerEmails.push(testUserEmail);
      process.env[`E2E_TEST_USER_EMAIL_${i}`] = testUserEmail;
      process.env[`E2E_TEST_USER_NAME_${i}`] = testUserName;
    }

    process.env.E2E_TEST_USER_PASSWORD = testUserPassword;
    process.env.E2E_TEST_TIMESTAMP = String(timestamp);

    const envData = {
      timestamp,
      password: testUserPassword,
      workers: workerEmails.map((email, i) => ({
        index: i,
        email,
        name: `E2E Test Worker ${i}`,
      })),
    };

    const envFilePath = path.join(process.cwd(), "e2e", E2E_ENV_FILE);
    fs.writeFileSync(envFilePath, JSON.stringify(envData, null, 2));
  } catch (error) {
    console.error("[e2e-setup] Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
