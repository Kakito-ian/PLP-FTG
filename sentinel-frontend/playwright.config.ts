import { defineConfig, devices } from "@playwright/test";

/**
 * Project Sentinel – Playwright E2E configuration
 *
 * Designed for deployment verification: smoke tests, auth flows, and
 * dashboard navigation that would catch regressions after a deploy.
 *
 * Run with:  pnpm playwright:test
 * UI mode:   pnpm playwright:ui
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  // Directory where all E2E spec files live
  testDir: "./e2e",

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in source
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit parallelism on CI to avoid port collisions
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  // Shared settings for all projects
  use: {
    baseURL: BASE_URL,

    // Capture screenshot on failure
    screenshot: "only-on-failure",

    // Capture video on first retry
    video: "on-first-retry",

    // Capture trace on first retry for debugging
    trace: "on-first-retry",

    // Generous timeout for slower CI environments
    actionTimeout: 15_000,
  },

  // Test project matrix
  projects: [
    // Setup project – runs authentication once and stores state
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // Main test suite – runs against Chromium with stored auth state
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Re-use the auth state created by the setup project
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // Smoke tests run without stored auth (verify the public-facing pages)
    {
      name: "smoke",
      testMatch: /.*smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Output directory for test artifacts
  outputDir: "test-results",

  // Auto-start the Next.js dev server when running locally.
  // On CI the app should already be running, so this is skipped.
  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
