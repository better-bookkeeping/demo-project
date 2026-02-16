/**
 * Intentionally a no-op. Cleanup is handled at the start of each test run
 * in global-setup.ts (truncate + reseed), which ensures a clean slate
 * regardless of whether the previous run completed, crashed, or was interrupted.
 */
export default function globalTeardown() {}
