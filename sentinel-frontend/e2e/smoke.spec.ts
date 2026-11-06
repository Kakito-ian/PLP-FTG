import { test, expect } from "@playwright/test";

/**
 * Smoke tests – deployment verification
 *
 * These tests run in the "smoke" project (no stored auth state) and verify
 * that the application is alive after a deploy.  They should be fast and
 * cover the absolute minimum:
 *
 *  1. The server responds (not a 5xx)
 *  2. The login page loads
 *  3. The root redirect works
 *  4. Critical static assets are served
 *  5. API proxy health check (Next.js route)
 *
 * Run independently with:  pnpm playwright:test:smoke
 */

test.describe("Smoke: App reachability", () => {
  test("root URL responds with 200 or redirect", async ({ page }) => {
    const response = await page.goto("/");
    // Either a direct 200 or a redirect chain ending in 200/30x is acceptable
    expect(response?.status()).toBeLessThan(500);
  });

  test("login page returns HTTP 200", async ({ page }) => {
    const response = await page.goto("/auth/v2/login");
    expect(response?.status()).toBe(200);
  });

  test("login page has no uncaught JS errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/auth/v2/login");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });

  test("login page renders expected elements", async ({ page }) => {
    await page.goto("/auth/v2/login");

    // The page must have at least one input field and a submit button
    const inputs = page.locator("input");
    await expect(inputs.first()).toBeVisible();

    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await expect(submitBtn).toBeVisible();
  });

  test("page title is not empty", async ({ page }) => {
    await page.goto("/auth/v2/login");
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });
});

test.describe("Smoke: Static assets", () => {
  test("application stylesheet is loaded", async ({ page }) => {
    const cssRequests: string[] = [];

    page.on("response", (res) => {
      if (
        res.url().includes("_next/static") &&
        res.headers()["content-type"]?.includes("text/css")
      ) {
        cssRequests.push(res.url());
      }
    });

    await page.goto("/auth/v2/login");
    await page.waitForLoadState("networkidle");

    // At least one CSS bundle should be loaded
    expect(cssRequests.length).toBeGreaterThanOrEqual(1);
  });

  test("application JS bundle is loaded", async ({ page }) => {
    const jsRequests: string[] = [];

    page.on("response", (res) => {
      const ct = res.headers()["content-type"] ?? "";
      if (
        res.url().includes("_next/static") &&
        (ct.includes("javascript") || ct.includes("application/x-javascript"))
      ) {
        jsRequests.push(res.url());
      }
    });

    await page.goto("/auth/v2/login");
    await page.waitForLoadState("networkidle");

    expect(jsRequests.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Smoke: API proxy health", () => {
  // The proxy routes forward requests to the Spring Boot backend.
  // When the backend is down they return 502/503/504 (gateway errors).
  // What we're verifying here is that the Next.js routing layer itself
  // is wired correctly — i.e. the route handler exists and responds
  // with *some* HTTP status rather than a hard Next.js 500 crash.
  //
  // Acceptable statuses: 2xx, 4xx, 502, 503, 504
  // NOT acceptable: 500 (internal Next.js error — means the route is broken)

  function isAcceptable(status: number): boolean {
    // Allow anything that isn't a plain 500
    return status !== 500;
  }

  test("Next.js API route for ml/overview is reachable", async ({
    request,
  }) => {
    const response = await request.get("/api/proxy/ml/overview");
    expect(isAcceptable(response.status())).toBe(true);
  });

  test("Next.js API route for executive/summary is reachable", async ({
    request,
  }) => {
    const response = await request.get("/api/proxy/executive/summary");
    expect(isAcceptable(response.status())).toBe(true);
  });

  test("Next.js API route for technicians is reachable", async ({
    request,
  }) => {
    const response = await request.get("/api/proxy/technicians");
    expect(isAcceptable(response.status())).toBe(true);
  });
});

test.describe("Smoke: Unauthorized access patterns", () => {
  test("dashboard route redirects unauthenticated user", async ({ page }) => {
    await page.goto("/dashboard/sentinel");
    await page.waitForLoadState("domcontentloaded");

    // Should NOT land on the dashboard
    expect(page.url()).not.toContain("/dashboard/sentinel");
  });

  test("unauthorized page is accessible", async ({ page }) => {
    const response = await page.goto("/unauthorized");
    // May return 200 or redirect; should not 5xx
    expect(response?.status()).toBeLessThan(500);
  });
});
