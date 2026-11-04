import { expect, test as base, type Page } from '@playwright/test';

import { E2E_USER } from './support/data';

/**
 * Hosts the app must never reach from a test run: Google Analytics/Config/Installations. The test
 * environment ships a fake apiKey + measurementId (H5 of the plan), so those requests can only
 * fail — and `AnalyticsService` additionally skips analytics entirely under `useEmulators`.
 * Blocking them is a safety net in case something else triggers them.
 */
const BLOCKED_GOOGLE_HOST =
  /googletagmanager\.com|google-analytics\.com|firebaseinstallations\.googleapis\.com|firebase\.googleapis\.com/;

/**
 * Shared e2e fixtures (issue #56):
 *
 * - blocks the Google hosts above and records every remaining console/page error so specs can
 *   assert a clean console with `expectNoConsoleErrors`;
 * - `signIn` helper for the common login flow.
 */
export const test = base.extend<{
  consoleErrors: string[];
}>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];

    await page.route((url) => BLOCKED_GOOGLE_HOST.test(url.hostname), (route) => route.abort());

    page.on('console', (message) => {
      if (message.type() !== 'error') {
        return;
      }
      const sourceUrl = message.location().url ?? '';
      // Errors coming from the blocked hosts are expected: they are aborted on purpose.
      if (BLOCKED_GOOGLE_HOST.test(sourceUrl)) {
        return;
      }
      errors.push(`${message.text()} (${sourceUrl})`);
    });
    page.on('pageerror', (error) => errors.push(String(error)));

    await use(errors);
  },
});

export { expect };

/** Logs in through the real login form and waits for the private list to be reached. */
export async function signIn(
  page: Page,
  { email, password }: { email: string; password: string } = E2E_USER,
): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/\/recipes\/my-recipes$/);
}

/** Asserts that no unexpected error reached the console during the test. */
export function expectNoConsoleErrors(consoleErrors: string[]): void {
  expect(consoleErrors, 'unexpected console errors').toEqual([]);
}
