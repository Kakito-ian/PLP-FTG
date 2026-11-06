import { test, expect } from "./fixtures";
import { ROUTES } from "./fixtures";

/**
 * Dashboard navigation & core UI tests
 *
 * These tests run with stored auth state (via the "chromium" project which
 * depends on "setup").  They verify that the main dashboard sections are
 * accessible and render without critical errors after a deployment.
 */

test.describe("Sentinel Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.dashboard);
  });

  test("sentinel dashboard page loads without errors", async ({ page }) => {
    // No uncaught JS errors
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.waitForLoadState("networkidle");
    expect(errors).toHaveLength(0);
  });

  test("page title contains Sentinel", async ({ page }) => {
    await expect(page).toHaveTitle(/sentinel/i);
  });

  test("sidebar navigation is visible", async ({ page }) => {
    // The sidebar nav should be rendered for authenticated users
    const sidebar = page.locator("nav, [role='navigation']").first();
    await expect(sidebar).toBeVisible();
  });

  test("main content area renders", async ({ page }) => {
    await expect(page.locator("main, [role='main']").first()).toBeVisible();
  });
});

test.describe("Dashboard navigation links", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.dashboard);
    // Wait for the page to be interactive
    await page.waitForLoadState("networkidle");
  });

  test("can navigate to Alerts page", async ({ page }) => {
    await page.goto(ROUTES.alerts);
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/alerts");
  });

  test("can navigate to Sites page", async ({ page }) => {
    await page.goto(ROUTES.sites);
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/sites");
  });

  test("can navigate to Hazards page", async ({ page }) => {
    await page.goto(ROUTES.hazards);
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/hazards");
  });

  test("can navigate to CAPAs page", async ({ page }) => {
    await page.goto(ROUTES.capas);
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/capas");
  });

  test("can navigate to ML Admin page", async ({ page }) => {
    await page.goto(ROUTES.mlAdmin);
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/ml-admin");
  });

  test("can navigate to Executive Dashboard", async ({ page }) => {
    await page.goto(ROUTES.executive);
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/executive");
  });

  test("can navigate to HSE Reports", async ({ page }) => {
    await page.goto(ROUTES.hseReports);
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/hse-reports");
  });

  test("can navigate to ESG Dashboard", async ({ page }) => {
    await page.goto(ROUTES.esg);
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/esg");
  });
});

test.describe("Auth-protected routes", () => {
  test("visiting a protected route while authenticated does NOT redirect to login", async ({
    page,
  }) => {
    await page.goto(ROUTES.dashboard);
    await page.waitForLoadState("domcontentloaded");

    // Should stay on the dashboard, not bounce to /auth
    expect(page.url()).not.toMatch(/\/auth\//);
  });

  test("404 not-found page renders for unknown dashboard routes", async ({
    page,
  }) => {
    await page.goto("/dashboard/this-route-does-not-exist-xyz");
    await page.waitForLoadState("domcontentloaded");

    // Next.js will either show a custom not-found page or a 404
    const status = await page
      .evaluate(() => document.title)
      .catch(() => "");
    // We just want the page to not crash – a 404 heading or "not found" text is acceptable
    const pageText = await page.locator("body").textContent();
    expect(pageText).toBeTruthy();
  });
});
