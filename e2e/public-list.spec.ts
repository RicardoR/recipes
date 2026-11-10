import type { Page } from '@playwright/test';

import { seedCategory, seedRecipe, uniqueId } from './support/data';
import { expect, expectNoConsoleErrors, renderAllCards, test } from './fixtures';

/**
 * P2 of plan/56-playwright-e2e.md: the public list renders seeded recipes (the `@defer` +
 * OnPush path that #83 left as a manual smoke), filters them by category, searches them from
 * the toolbar and opens the details page with "Ver".
 *
 * Specs run in parallel against one shared emulator, so every test seeds data tagged with a
 * per-invocation `uid` and only asserts about *its own* documents — never about list totals.
 */

/** Cards whose text contains `title` (titles embed the test's unique uid, so this is 0 or 1). */
function card(page: Page, title: string) {
  return page.getByTestId('recipe-card').filter({ hasText: title });
}

test('renders the seeded public recipes and hides private ones', async ({ page, consoleErrors }) => {
  const uid = uniqueId();
  const publicTitle = `Receta pública ${uid}`;
  const secondTitle = `Segunda receta ${uid}`;
  const privateTitle = `Receta privada ${uid}`;

  await seedRecipe({ title: publicTitle });
  await seedRecipe({ title: secondTitle });
  // Private recipe owned by somebody else: the anonymous public query must not return it.
  await seedRecipe({ title: privateTitle, private: true, ownerId: 'someone-else' });

  await page.goto('/recipes');
  await renderAllCards(page);

  // The cards come from a deferred block (`@defer (on viewport)`) on an OnPush component:
  // `renderAllCards` proves the async view actually paints.
  await expect(page.getByTestId('recipe-list')).toBeVisible();
  await expect(page.getByTestId('recipe-card-title').filter({ hasText: publicTitle })).toBeVisible();
  await expect(card(page, secondTitle)).toBeVisible();
  await expect(card(page, privateTitle)).toHaveCount(0);

  expectNoConsoleErrors(consoleErrors);
});

test('reduces the list when a category is selected', async ({ page, consoleErrors }) => {
  const uid = uniqueId();
  const vegetable = { id: `p2-veg-${uid}`, detail: `Verduras ${uid}` };
  const dessert = { id: `p2-des-${uid}`, detail: `Postres ${uid}` };
  const withVegetables = `Con verduras ${uid}`;
  const withDessert = `Con postres ${uid}`;

  await seedCategory(vegetable.id, vegetable.detail);
  await seedCategory(dessert.id, dessert.detail);
  await seedRecipe({ title: withVegetables, categories: [{ id: vegetable.id, detail: vegetable.detail }] });
  await seedRecipe({ title: withDessert, categories: [{ id: dessert.id, detail: dessert.detail }] });

  await page.goto('/recipes');
  await renderAllCards(page);
  await expect(card(page, withVegetables)).toBeVisible();
  await expect(card(page, withDessert)).toBeVisible();

  // Open the filter and pick only the first category: the other recipe must disappear.
  // The panel of a `multiple` select stays open, so the deselect below happens in the very
  // same open panel — reopening it while the close animation runs loses the click (flaky).
  await page.getByTestId('category-filter').click();
  const vegetableOption = page.getByRole('option', { name: vegetable.detail, exact: true });
  await vegetableOption.click();

  await expect(card(page, withVegetables)).toBeVisible();
  await expect(card(page, withDessert)).toHaveCount(0);

  // Clicking the option again deselects it and the whole list comes back.
  await vegetableOption.click();
  await page.keyboard.press('Escape');
  // The panel must be fully gone before the page is scrolled/asserted on.
  await expect(vegetableOption).toBeHidden();

  await renderAllCards(page);
  await expect(card(page, withVegetables)).toBeVisible();
  await expect(card(page, withDessert)).toBeVisible();

  expectNoConsoleErrors(consoleErrors);
});

test('searches from the toolbar and restores the list when cleared', async ({ page, consoleErrors }) => {
  const uid = uniqueId();
  const otherUid = uniqueId();
  const matchingTitle = `Gazpacho ${uid}`;
  // A different unique token: searching for `uid` must match only the first recipe.
  const otherTitle = `Tarta de queso ${otherUid}`;

  await seedRecipe({ title: matchingTitle });
  await seedRecipe({ title: otherTitle });

  await page.goto('/recipes');
  await renderAllCards(page);
  await expect(card(page, matchingTitle)).toBeVisible();
  await expect(card(page, otherTitle)).toBeVisible();

  await page.getByTestId('toolbar-search-toggle').click();
  const search = page.getByTestId('toolbar-search');
  await search.fill(uid);

  await renderAllCards(page);
  await expect(card(page, matchingTitle)).toBeVisible();
  await expect(card(page, otherTitle)).toHaveCount(0);

  await search.fill('');
  await renderAllCards(page);
  await expect(card(page, matchingTitle)).toBeVisible();
  await expect(card(page, otherTitle)).toBeVisible();

  expectNoConsoleErrors(consoleErrors);
});

test('opens the details page with the "Ver" button', async ({ page, consoleErrors }) => {
  const uid = uniqueId();
  const title = `Receta para ver ${uid}`;
  const recipeId = await seedRecipe({ title });

  await page.goto('/recipes');
  await renderAllCards(page);
  await card(page, title).getByTestId('recipe-view').click();

  await expect(page).toHaveURL(new RegExp(`/recipes/details/${recipeId}$`));
  await expect(page.locator('app-recipe-details')).toBeVisible();
  await expect(page.locator('app-recipe-details').getByText(title)).toBeVisible();

  expectNoConsoleErrors(consoleErrors);
});
