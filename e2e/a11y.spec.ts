import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

import { seedRecipe, uniqueId } from './support/data';
import { expect, expectNoConsoleErrors, renderAllCards, signIn, test } from './fixtures';

/**
 * P6 of plan/56-playwright-e2e.md: automated accessibility checks (WCAG 2.1 A/AA) on the three
 * key screens of the app — the login form, the recipe list and the recipe form.
 *
 * Run with `AxeBuilder` (axe-core under the hood): it injects the library into the page and
 * returns the violations instead of failing on the first one, so the assertion below can show
 * every problem at once. Only the WCAG 2.1 A/AA rules are enabled, which keeps this independent
 * of the axe "best-practice" rules that would flag design choices instead of accessibility
 * defects.
 *
 * These specs only read, so they need no seeding and no cleanup (D7/D8 do not apply).
 *
 * `expectNoA11yViolations` runs axe on the current page and fails with a readable report of
 * every violation (all of them at once, not just the first).
 */
async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const report = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help}\n` +
      violation.nodes.map((node) => `    ${node.target.join(' ')}`).join('\n'),
  );

  expect(report, 'accessibility violations').toEqual([]);
}

test('the login form has no accessibility violations', async ({ page, consoleErrors }) => {
  await page.goto('/login');

  // The form is the focus of this screen: wait until it is actually rendered.
  await expect(page.getByTestId('login-email')).toBeVisible();
  await expectNoA11yViolations(page);

  expectNoConsoleErrors(consoleErrors);
});

test('the recipe list has no accessibility violations', async ({ page, consoleErrors }) => {
  const uid = uniqueId();
  // The suite starts from an empty emulator (globalSetup), so seed one public recipe: without
  // a card the deferred list has nothing to paint and there is no page to scan.
  await seedRecipe({ title: `Receta accesible ${uid}` });

  // Public screen: no login needed, so this also checks the logged-out chrome.
  await page.goto('/recipes');
  await renderAllCards(page);

  await expectNoA11yViolations(page);

  expectNoConsoleErrors(consoleErrors);
});

test('the recipe form has no accessibility violations', async ({ page, consoleErrors }) => {
  await signIn(page);

  // "Crear receta" lives inside the toolbar menu, not in the bar itself.
  await page.getByTestId('toolbar-menu').click();
  await page.getByTestId('toolbar-create').click();
  await expect(page.getByTestId('recipe-form')).toBeVisible();

  // Empty form: this is the state users hit first, and where the labels/errors matter most.
  await expectNoA11yViolations(page);

  expectNoConsoleErrors(consoleErrors);
});
