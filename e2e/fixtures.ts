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

/**
 * Makes every card of the list exist in the DOM.
 *
 * The list renders each card inside `@defer (on viewport)`: cards below the fold stay as
 * skeletons until they cross the viewport, so a test asserting about a card near the bottom
 * (or about the whole list after it grows again) has to walk the page first. Scrolls back to
 * the top afterwards, so assertions and clicks start from the natural position.
 */
export async function renderAllCards(page: Page): Promise<void> {
  // The list container renders before Firestore answers: wait for the first real card.
  await expect(page.getByTestId('recipe-card').first()).toBeVisible();

  await page.evaluate(async () => {
    const step = Math.max(Math.floor(window.innerHeight / 2), 300);
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      // Two frames: IntersectionObserver callbacks run between them.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    window.scrollTo(0, 0);
  });

  await expect
    .poll(() => page.locator('.placeholder-skeleton').count(), { timeout: 10_000 })
    .toBe(0);
}
