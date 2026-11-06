import { test, expect } from "@playwright/test";
import { ROUTES } from "./fixtures";

/**
 * Authentication flow tests
 *
 * These tests run WITHOUT stored auth state (they use the base `test` from
 * @playwright/test, not the stored-state project).  They verify the login
 * page itself and the authentication mechanics.
 */

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.login);
  });

  test("renders the login form", async ({ page }) => {
    await expect(page).toHaveTitle(/sentinel/i);

    // Email and password inputs must be present
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Primary sign-in button
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows the dev-bypass button in test mode", async ({ page }) => {
    // NEXT_PUBLIC_TEST_MODE=true is set in .env.local, so the button must appear
    await expect(
      page.getByRole("button", { name: /dev login/i }),
    ).toBeVisible();
  });

  test("validates email field before submission", async ({ page }) => {
    // Submit with an invalid email
    await page.getByLabel(/email address/i).fill("not-an-email");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Zod validation should show an error
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("validates password min-length before submission", async ({ page }) => {
    await page.getByLabel(/email address/i).fill("user@sentinel.kpc");
    await page.getByLabel(/password/i).fill("abc"); // too short
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
  });

  test("dev-bypass login redirects to /dashboard/sentinel", async ({ page }) => {
    await page.getByRole("button", { name: /dev login/i }).click();

    await page.waitForURL("**/dashboard/sentinel", { timeout: 15_000 });
    expect(page.url()).toContain("/dashboard/sentinel");
  });

  test("unauthenticated access to dashboard redirects to login", async ({ page }) => {
    // Navigate directly to the dashboard without logging in
    await page.goto(ROUTES.dashboard);

    // Should end up back on the login page (middleware redirect)
    await expect(page).toHaveURL(/auth/);
  });
});

test.describe("Post-login state", () => {
  test.beforeEach(async ({ page }) => {
    // Log in fresh before each test in this group
    await page.goto(ROUTES.login);
    await page.getByRole("button", { name: /dev login/i }).click();
    await page.waitForURL("**/dashboard/sentinel", { timeout: 15_000 });
  });

  test("logged-in user sees the sentinel dashboard", async ({ page }) => {
    await expect(page).toHaveURL(/dashboard\/sentinel/);
  });

  test("dashboard page title is set correctly", async ({ page }) => {
    // Title should contain the product name
    await expect(page).toHaveTitle(/sentinel/i);
  });
});
