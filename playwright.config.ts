import { defineConfig, devices } from '@playwright/test';

/**
 * E2E configuration for the recipes app (issue #56).
 *
 * The app is served with `recipes:build:test` (environment.test.ts → useEmulators: true) so it
 * talks to the local Firebase emulators instead of a real project. Both the emulators and the
 * dev server are started by Playwright itself; `reuseExistingServer` keeps them warm between
 * runs so consecutive `yarn e2e` calls are fast.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results',
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:4200',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      // Firebase emulators (auth 9099, firestore 8080, storage 9199). Port-only readiness: the
      // Emulator UI is a convenience, not a requirement. The command frees stale emulator
      // processes first (see e2e/support/start-emulators.mjs).
      command: 'yarn emulators',
      port: 9099,
      reuseExistingServer: true,
      timeout: 120_000,
      // Signal the whole process group on shutdown: without it firebase-tools exits first and
      // leaves the Firestore JVM emulator orphaned (see e2e/support/start-emulators.mjs).
      gracefulShutdown: { signal: 'SIGTERM', timeout: 15_000 },
    },
    {
      // Angular dev server with the test environment (useEmulators: true).
      command: 'yarn start:e2e',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  globalSetup: './e2e/global-setup.ts',
});
