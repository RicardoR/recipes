import { E2E_USER, ensureUser, seedRecipe } from './support/data';
import { expect, expectNoConsoleErrors, signIn, test } from './fixtures';

/**
 * P3 of plan/56-playwright-e2e.md: recipe details + permissions. A public recipe is readable
 * anonymously, a foreign private one is rejected by `PrivateRecipeGuard` (snackbar + redirect
 * to /recipes) and an own private one renders once signed in as its owner.
 */
test('a public recipe is readable without logging in', async ({ page, consoleErrors }) => {
  const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const title = `Receta pública ${uid}`;
  const recipeId = await seedRecipe({
    title,
    ingredients: [`Ingrediente ${uid}`],
    steps: [`Paso ${uid}`],
  });

  await page.goto(`/recipes/details/${recipeId}`);

  await expect(page.getByTestId('recipe-details-title')).toHaveText(title);
  // The ingredients/steps live in collapsed expansion panels: expanding them proves the
  // seeded arrays actually reach the template.
  await page.getByTestId('recipe-details-ingredients').click();
  await expect(page.getByText(`Ingrediente ${uid}`)).toBeVisible();
  await page.getByTestId('recipe-details-steps').click();
  await expect(page.getByText(`Paso ${uid}`)).toBeVisible();

  expectNoConsoleErrors(consoleErrors);
});

test('a foreign private recipe shows the snackbar and redirects to the list', async ({
  page,
  consoleErrors,
}) => {
  const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const title = `Receta privada ajena ${uid}`;
  const recipeId = await seedRecipe({ title, private: true, ownerId: 'someone-else' });

  await page.goto(`/recipes/details/${recipeId}`);

  // `PrivateRecipeGuard` (private-recipe.guard.ts): not the owner -> navigate away + snackbar.
  await expect(page).toHaveURL(/\/recipes$/);
  await expect(
    page.getByText('No estás autorizado para ver esta receta'),
  ).toBeVisible();
  await expect(page.getByTestId('recipe-details-title')).toHaveCount(0);

  expectNoConsoleErrors(consoleErrors);
});

test('an own private recipe renders for its signed-in owner', async ({ page, consoleErrors }) => {
  const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const title = `Receta privada propia ${uid}`;
  // Same user `signIn` logs in with: the guard compares `recipe.ownerId` with the session uid.
  const ownerId = await ensureUser(E2E_USER.email, E2E_USER.password);
  const recipeId = await seedRecipe({ title, private: true, ownerId });

  await signIn(page);
  await page.goto(`/recipes/details/${recipeId}`);

  await expect(page).toHaveURL(new RegExp(`/recipes/details/${recipeId}$`));
  await expect(page.getByTestId('recipe-details-title')).toHaveText(title);

  expectNoConsoleErrors(consoleErrors);
});
