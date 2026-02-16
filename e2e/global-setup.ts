import { chromium, FullConfig } from "@playwright/test";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function globalSetup(config: FullConfig) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

  // Run the seed script — it handles DB creation, migrations, cleanup, and seeding.
  // DATABASE_URL is set by playwright.config.ts webServer.env and inherited here.
  execSync("bun run prisma/seed.ts", {
    env: process.env,
    cwd: root,
    stdio: "inherit",
  });

  // Launch browser, sign in, and save auth state
  const baseURL = config.projects[0].use.baseURL || "http://localhost:3001";
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/sign-in`, { waitUntil: "networkidle" });
  await page.locator("#email").waitFor({ state: "visible" });
  await page.fill("#email", "e2e@test.com");
  await page.fill("#password", "testpassword123");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("sign-in"));

  await page.context().storageState({ path: "e2e/.auth/user.json" });
  await browser.close();
  console.log("Auth state saved.");
}

export default globalSetup;
