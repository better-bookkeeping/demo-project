#!/usr/bin/env bun
/**
 * Wrapper script for Prisma migrations that uses the shared database config.
 */
import { DATABASE_URL } from "../config/database";
import { $ } from "bun";

process.env.DATABASE_URL = DATABASE_URL;

await $`prisma migrate dev`;
