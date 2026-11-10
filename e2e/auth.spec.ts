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
   * Issue #91 (evolution of H6/D6 in plan/56-playwright-e2e.md): without a session the guard used
   * to return `false` and cancel the navigation, leaving a blank screen. It now returns a `UrlTree`
   * to `/login` carrying the requested route in `returnUrl`.
   */
  test('redirects to /login with the requested route as returnUrl', async ({ page, consoleErrors }) => {
    await page.goto('/recipes/my-recipes');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Frecipes%2Fmy-recipes$/);
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.locator('app-my-recipes')).toHaveCount(0);

    await page.goto('/recipes/new');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Frecipes%2Fnew$/);
    await expect(page.getByTestId('login-email')).toBeVisible();

    expectNoConsoleErrors(consoleErrors);
  });

  test('returns to the requested route after signing in', async ({ page, consoleErrors }) => {
    await page.goto('/recipes/my-recipes');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Frecipes%2Fmy-recipes$/);

    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/\/recipes\/my-recipes$/);
    await expect(page.getByTestId('toolbar-menu')).toBeVisible();
    await expect(page.getByTestId('login-email')).toHaveCount(0);

    expectNoConsoleErrors(consoleErrors);
  });
});
