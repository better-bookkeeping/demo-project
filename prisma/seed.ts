import { PrismaClient } from "./generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { execSync } from "node:child_process";
import path from "node:path";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const TEST_EMAIL = "e2e@test.com";
const TEST_PASSWORD = "testpassword123";
const TEST_NAME = "E2E Test User";
const BCRYPT_SALT_ROUNDS = 12;

const SEED_MOVEMENTS = [
  { name: "Bench Press", bodyWeight: false },
  { name: "Squat", bodyWeight: false },
  { name: "Deadlift", bodyWeight: false },
  { name: "Pull-Up", bodyWeight: true },
];

async function ensureDatabaseExists() {
  const url = new URL(DATABASE_URL);
  const dbName = url.pathname.slice(1); // strip leading /
  url.pathname = "/postgres";

  try {
    execSync(`psql "${url.toString()}" -c "CREATE DATABASE ${dbName}"`, {
      stdio: "pipe",
    });
    console.log(`Created database "${dbName}".`);
  } catch {
    // Database already exists — fine
  }

  // Run migrations — prisma.config.ts reads DATABASE_URL from env
  execSync("bunx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL },
    cwd: path.resolve(new URL(".", import.meta.url).pathname, ".."),
    stdio: "inherit",
  });
}

async function main() {
  await ensureDatabaseExists();

  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // Clean all data in FK-safe order before seeding
    await prisma.set.deleteMany();
    await prisma.session.deleteMany();
    await prisma.nutritionLog.deleteMany();
    await prisma.userWeight.deleteMany();
    await prisma.workout.deleteMany();
    await prisma.movement.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { email: TEST_EMAIL },
      update: { name: TEST_NAME, password: hashedPassword },
      create: { email: TEST_EMAIL, name: TEST_NAME, password: hashedPassword },
    });

    for (const movement of SEED_MOVEMENTS) {
      const existing = await prisma.movement.findFirst({
        where: { name: movement.name, userId: user.id },
      });
      if (!existing) {
        await prisma.movement.create({ data: { ...movement, userId: user.id } });
      }
    }

    console.log("Seed completed: test user and movements created.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
