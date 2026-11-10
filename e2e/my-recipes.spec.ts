import { deleteRecipesWithTitle, E2E_USER, ensureUser, seedRecipe, uniqueId } from './support/data';
import { expect, expectNoConsoleErrors, renderAllCards, signIn, test } from './fixtures';

/**
 * P4 of plan/56-playwright-e2e.md: CRUD in "Mis recetas" — create from `recipe-card-form`,
 * edit at `/recipes/edit/:id` (verifying the change survives a reload) and delete through the
 * confirmation dialog. Runs with `e2e@example.com`: every mutation throws for the demo user (H4).
 *
 * Cleanup (D8): no global `clearFirestore()` here — specs run in parallel against one emulator,
 * so each test tags its documents with `uid` and deletes only those in `afterEach`.
 */
let uid = uniqueId();

test.beforeEach(() => {
  uid = uniqueId();
});

test.afterEach(async () => {
  await deleteRecipesWithTitle(uid);
});

test('creates a recipe from the form, with required-field validation', async ({
  page,
  consoleErrors,
}) => {
  const title = `Receta creada ${uid}`;

  await signIn(page);
  await page.goto('/recipes/new');

  // The submit button stays disabled while required fields are empty.
  await expect(page.getByTestId('form-submit')).toBeDisabled();
  await page.getByTestId('form-title').fill(title);
  await expect(page.getByTestId('form-submit')).toBeDisabled();

  await page.getByTestId('form-description').fill(`Descripción ${uid}`);
  await expect(page.getByTestId('form-submit')).toBeEnabled();

  // A newly added (empty) ingredient invalidates the form again until it is filled.
  await page.getByRole('button', { name: 'Añadir ingrediente' }).click();
  await expect(page.getByTestId('form-submit')).toBeDisabled();
  await page.getByPlaceholder('Ingrediente').fill(`Ingrediente ${uid}`);
  await expect(page.getByTestId('form-submit')).toBeEnabled();

  await page.getByTestId('form-submit').click();

  await expect(page).toHaveURL(/\/recipes\/my-recipes$/);
  await renderAllCards(page);
  await expect(
    page.getByTestId('recipe-card-title').filter({ hasText: title }),
  ).toBeVisible();

  expectNoConsoleErrors(consoleErrors);
});

test('edits a recipe and the change persists after a reload', async ({ page, consoleErrors }) => {
  const oldTitle = `Receta a editar ${uid}`;
  const newTitle = `Receta editada ${uid}`;
  const ownerId = await ensureUser(E2E_USER.email, E2E_USER.password);
  const recipeId = await seedRecipe({ title: oldTitle, ownerId });

  await signIn(page);
  await page.goto(`/recipes/edit/${recipeId}`);
  // The form is filled from Firestore once the details arrive.
  await expect(page.getByTestId('form-title')).toHaveValue(oldTitle);

  await page.getByTestId('form-title').fill(newTitle);
  await page.getByTestId('form-submit').click();
  await expect(page.getByText('Receta actualizada')).toBeVisible();

  // Reload: the edit page fetches the document again, so this proves the write reached
  // the emulator (not only the local form state).
  await page.reload();
  await expect(page.getByTestId('form-title')).toHaveValue(newTitle);

  await page.goto(`/recipes/details/${recipeId}`);
  await expect(page.getByTestId('recipe-details-title')).toHaveText(newTitle);

  expectNoConsoleErrors(consoleErrors);
});

test('deletes a recipe from the confirmation dialog', async ({ page, consoleErrors }) => {
  const title = `Receta a borrar ${uid}`;
  const ownerId = await ensureUser(E2E_USER.email, E2E_USER.password);
  await seedRecipe({ title, ownerId });

  await signIn(page);
  await page.goto('/recipes/my-recipes');
  await renderAllCards(page);
  const card = page.getByTestId('recipe-card').filter({ hasText: title });
  await expect(card).toBeVisible();

  // Cancel: the dialog closes and the recipe stays in the list. Waiting for the dialog to be
  // *destroyed* before opening it again avoids overlapping with its exit animation (H11-style).
  await card.getByTestId('recipe-delete').click();
  await page.getByTestId('dialog-cancel').click();
  await expect(page.getByTestId('dialog-confirm')).toHaveCount(0);
  await expect(card).toBeVisible();

  // Confirm: the recipe is removed from the list.
  await card.getByTestId('recipe-delete').click();
  await page.getByTestId('dialog-confirm').click();
  await expect(card).toHaveCount(0);

  expectNoConsoleErrors(consoleErrors);
});
