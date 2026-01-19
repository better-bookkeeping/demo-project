#!/usr/bin/env bun
/**
 * On-demand migration script to hash plaintext passwords with argon2.
 *
 * Usage:
 *   bun scripts/migrate-passwords.ts [options]
 *
 * Options:
 *   --batch-size, -b  Users per batch (default: 100)
 *   --delay, -d       Delay in ms between batches (default: 1000)
 *   --limit, -l       Max users to migrate in this run (default: all)
 *   --dry-run         Show what would be migrated without making changes
 *
 * Examples:
 *   bun scripts/migrate-passwords.ts --dry-run
 *   bun scripts/migrate-passwords.ts --batch-size 50 --delay 2000
 *   bun scripts/migrate-passwords.ts --limit 1000
 */

import { parseArgs } from "util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client/client";
import { hash } from "argon2";
import { DATABASE_URL } from "../config/database";

type User = { id: string; email: string; password: string };
type HashedUser = { id: string; email: string; hashedPassword: string };

const parseConfig = () => {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "batch-size": { type: "string", short: "b", default: "100" },
      delay: { type: "string", short: "d", default: "1000" },
      limit: { type: "string", short: "l" },
      "dry-run": { type: "boolean", default: false },
    },
  });

  return {
    batchSize: parseInt(values["batch-size"]!, 10),
    delayMs: parseInt(values["delay"]!, 10),
    limit: values["limit"] ? parseInt(values["limit"], 10) : undefined,
    dryRun: values["dry-run"] ?? false,
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  return new PrismaClient({ adapter });
};

const findPlaintextUsers = (prisma: PrismaClient, take: number) =>
  prisma.user.findMany({
    where: { NOT: { password: { startsWith: "$argon2" } } },
    select: { id: true, email: true, password: true },
    take,
  });

const countPlaintextUsers = (prisma: PrismaClient) =>
  prisma.user.count({
    where: { NOT: { password: { startsWith: "$argon2" } } },
  });

const hashUserPassword = async (user: User): Promise<HashedUser> => ({
  id: user.id,
  email: user.email,
  hashedPassword: await hash(user.password),
});

const updateUserPasswords = (prisma: PrismaClient, users: HashedUser[]) =>
  prisma.$transaction(
    users.map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: { password: user.hashedPassword },
      })
    )
  );

const processBatch = async (
  prisma: PrismaClient,
  batchSize: number,
  dryRun: boolean
): Promise<string[]> => {
  const users = await findPlaintextUsers(prisma, batchSize);
  if (users.length === 0) return [];

  const emails = users.map((u) => u.email);

  if (dryRun) {
    emails.forEach((email) => console.log(`  [DRY RUN] Would migrate: ${email}`));
    return emails;
  }

  const hashedUsers = await Promise.all(users.map(hashUserPassword));
  await updateUserPasswords(prisma, hashedUsers);
  emails.forEach((email) => console.log(`  ✓ Migrated: ${email}`));

  return emails;
};

const migratePasswords = async () => {
  const config = parseConfig();
  const prisma = createPrismaClient();

  try {
    console.log("Counting users with plaintext passwords...");
    const totalPlaintext = await countPlaintextUsers(prisma);

    if (totalPlaintext === 0) {
      console.log("No users with plaintext passwords found. Nothing to migrate.");
      return;
    }

    const toMigrate = config.limit
      ? Math.min(config.limit, totalPlaintext)
      : totalPlaintext;

    console.log(`Found ${totalPlaintext} user(s) with plaintext passwords.`);
    console.log(
      `Will migrate ${toMigrate} user(s) in batches of ${config.batchSize} with ${config.delayMs}ms delay.`
    );

    if (config.dryRun) {
      console.log("\n[DRY RUN] No changes will be made.\n");
    }

    let migrated = 0;
    let batchNumber = 0;

    while (migrated < toMigrate) {
      batchNumber++;
      const batchSize = Math.min(config.batchSize, toMigrate - migrated);

      console.log(`\nBatch ${batchNumber}: Processing up to ${batchSize} user(s)...`);

      const migratedEmails = await processBatch(prisma, batchSize, config.dryRun);
      if (migratedEmails.length === 0) break;

      migrated += migratedEmails.length;
      const progress = Math.round((migrated / toMigrate) * 100);
      console.log(`Progress: ${migrated}/${toMigrate} (${progress}%)`);

      const hasMoreWork = migrated < toMigrate;
      if (hasMoreWork) {
        console.log(`Waiting ${config.delayMs}ms before next batch...`);
        await sleep(config.delayMs);
      }
    }

    const remaining = totalPlaintext - migrated;
    const action = config.dryRun ? "[DRY RUN] Would have migrated" : "Successfully migrated";
    console.log(`\n${action} ${migrated} password(s).`);

    if (remaining > 0) {
      console.log(`Remaining users with plaintext passwords: ${remaining}`);
      console.log("Run the script again to continue migration.");
    }
  } finally {
    await prisma.$disconnect();
  }
};

migratePasswords().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
