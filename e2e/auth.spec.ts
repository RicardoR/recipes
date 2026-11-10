import { DEMO_USER } from './support/data';
import { expect, expectNoConsoleErrors, signIn, test } from './fixtures';

/**
 * P1 of plan/56-playwright-e2e.md: login form validation/prefill/toggle, logout from the
 * toolbar menu and the AuthGuard behaviour without a session (H6).
 */
test.describe('login form', () => {
  test('is prefilled with the demo user and signs in on submit', async ({ page, consoleErrors }) => {
    await page.goto('/login');

    // H4: the demo credentials are pre-filled so the visitor can enter in one click.
    await expect(page.getByTestId('login-email')).toHaveValue(DEMO_USER.email);
    await expect(page.getByTestId('login-password')).toHaveValue(DEMO_USER.password);
    // A valid pre-filled form shows no error yet.
    await expect(page.getByTestId('login-error')).toHaveCount(0);

    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/\/recipes\/my-recipes$/);
    await expect(page.getByTestId('toolbar-menu')).toBeVisible();

    expectNoConsoleErrors(consoleErrors);
  });

  test('rejects an empty or invalid email and stays on /login', async ({ page, consoleErrors }) => {
    await page.goto('/login');

    await page.getByTestId('login-email').fill('');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('You must enter a value');

    await page.getByTestId('login-email').fill('not-an-email');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Not a valid email');

    expectNoConsoleErrors(consoleErrors);
  });

  test('toggles the password visibility', async ({ page, consoleErrors }) => {
    await page.goto('/login');
    const password = page.getByTestId('login-password');
    const toggle = page.getByTestId('login-toggle-password');

    await expect(password).toHaveAttribute('type', 'password');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await toggle.click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(password).toHaveAttribute('type', 'password');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    expectNoConsoleErrors(consoleErrors);
  });

  test('is reached from the toolbar login button', async ({ page, consoleErrors }) => {
    await page.goto('/recipes');
    await expect(page.getByTestId('toolbar-login')).toBeVisible();

    await page.getByTestId('toolbar-login').click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-email')).toBeVisible();

    expectNoConsoleErrors(consoleErrors);
  });

  test('logs out from the toolbar menu', async ({ page, consoleErrors }) => {
    await signIn(page);

    await page.getByTestId('toolbar-menu').click();
    const logoutItem = page.getByTestId('toolbar-logout');
    await expect(logoutItem).toContainText('Cerrar sesión');
    await logoutItem.click();

    await expect(page).toHaveURL(/\/recipes$/);
    await expect(page.getByTestId('toolbar-login')).toBeVisible();
    await expect(page.getByTestId('toolbar-menu')).toBeHidden();

    expectNoConsoleErrors(consoleErrors);
  });
});

test.describe('AuthGuard', () => {
  /**
   * H6/D6 of the plan: `AuthGuard` returns `initAuthListener()`, so without a session the
   * emission of `false` **cancels** the navigation — it does **not** redirect to `/login` (the
   * only navigation to the login page is the toolbar button). Observed on a cold load of
   * `/recipes/my-recipes`: the router restores the initial URL (`/`), the layout/toolbar are
   * never painted and the outlet stays empty.
   *
   * Accepted as-is for #56; issue #91 adds the redirect to `/login` (details in
   * plan/56-playwright-e2e.md §0.2/§0.3). When that lands, this spec must assert the redirect.
   */
  test('cancels the navigation without redirecting to /login', async ({ page, consoleErrors }) => {
    await page.goto('/recipes/my-recipes');

    // Polled: `page.goto` resolves before the router evaluates the guard, so the requested URL
    // is still there for a moment; the cancelled navigation then restores the initial URL.
    await expect(page).toHaveURL(/\/$/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByTestId('toolbar-login')).toHaveCount(0);
    await expect(page.locator('app-my-recipes')).toHaveCount(0);
    await expect(page.locator('app-public-recipe-list')).toHaveCount(0);

    expectNoConsoleErrors(consoleErrors);
  });
});
