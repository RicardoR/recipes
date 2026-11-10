import { expect, expectNoConsoleErrors, signIn, test } from './fixtures';

/**
 * Smoke test (P0 of plan/56-playwright-e2e.md): the app boots, the auth guard lets the visitor
 * in, the real login flow works against the auth emulator and logout restores the anonymous
 * toolbar. This is the scenario that used to be a manual checklist.
 */
test('boot → login → logout', async ({ page, consoleErrors }) => {
  await page.goto('/');

  // Anonymous visitor lands on the public list and sees the login shortcut.
  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByTestId('toolbar-login')).toBeVisible();

  // Real login through the form (emulator user seeded by global-setup).
  await signIn(page);
  await expect(page.getByTestId('toolbar-menu')).toBeVisible();

  // Logout from the toolbar menu.
  await page.getByTestId('toolbar-menu').click();
  await page.getByTestId('toolbar-logout').click();

  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByTestId('toolbar-login')).toBeVisible();
  await expect(page.getByTestId('toolbar-menu')).toBeHidden();

  expectNoConsoleErrors(consoleErrors);
});
