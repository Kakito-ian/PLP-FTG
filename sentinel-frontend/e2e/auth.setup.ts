import { test as setup } from "@playwright/test";
import path from "path";

/**
 * Auth setup – runs once before the main test suite.
 *
 * Logs in using the dev-bypass button (TEST_MODE=true) and saves
 * browser storage state so subsequent tests start already authenticated.
 *
 * Output file is gitignored – it contains the session cookie/localStorage.
 */

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("authenticate via dev bypass", async ({ page }) => {
  await page.goto("/auth/v2/login");

  // Wait for the dev-bypass button (only rendered when NEXT_PUBLIC_TEST_MODE=true)
  const devLoginBtn = page.getByRole("button", {
    name: /dev login/i,
  });
  await devLoginBtn.waitFor({ state: "visible", timeout: 10_000 });
  await devLoginBtn.click();

  // After successful login the app redirects to the sentinel dashboard
  await page.waitForURL("**/dashboard/sentinel", { timeout: 15_000 });

  // Persist session to file
  await page.context().storageState({ path: AUTH_FILE });
});
