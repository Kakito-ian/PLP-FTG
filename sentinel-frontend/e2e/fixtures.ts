import { test as base, expect } from "@playwright/test";

/**
 * Sentinel E2E fixtures
 *
 * Extends Playwright's base `test` with:
 *  - `sentinelPage`: a page that's already on the sentinel dashboard
 *  - helper assertions specific to Sentinel's UI patterns
 */

type SentinelFixtures = {
  /** A page already navigated to /dashboard/sentinel */
  sentinelPage: ReturnType<typeof base.extend> extends infer T ? never : never;
};

/**
 * Authenticated test – inherits the storage state set up by auth.setup.ts.
 * All tests that `import { test } from "./fixtures"` are automatically authenticated.
 */
export const test = base.extend({
  // No extra fixtures needed beyond the storageState in playwright.config.ts,
  // but this is the right place to add page-object models or shared helpers later.
});

export { expect };

/**
 * Navigation helpers – shared URL constants so tests don't hard-code paths.
 */
export const ROUTES = {
  home: "/",
  login: "/auth/v2/login",
  dashboard: "/dashboard/sentinel",
  alerts: "/dashboard/sentinel/alerts",
  sites: "/dashboard/sentinel/sites",
  hazards: "/dashboard/sentinel/hazards",
  capas: "/dashboard/sentinel/capas",
  mlAdmin: "/dashboard/ml-admin",
  controlPlane: "/dashboard/control-plane/tanks",
  executive: "/dashboard/executive",
  hseReports: "/dashboard/hse-reports",
  esg: "/dashboard/esg",
  users: "/dashboard/users",
} as const;
