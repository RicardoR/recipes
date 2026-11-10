import path from 'node:path';

import type {Page} from '@playwright/test';

import {
  deleteRecipesWithTitle,
  E2E_USER,
  ensureUser,
  seedCategory,
  seedRecipe,
  uniqueId,
} from './support/data';
import {expect, expectNoConsoleErrors, renderAllCards, signIn, test} from './fixtures';

/**
 * P5 of plan/56-playwright-e2e.md: the picture flow — the biggest manual smoke of the previous
 * plans. Covers `file-input` through the real user path (the browse button + `filechooser`,
 * never a real OS dialog): filename/preview, the `required` + `imageValidator` gates on
 * "Subir imagen", category changes not wiping the field, both `imgSrc` paths (default asset vs
 * upload to the Storage emulator) and `deleteImage` ignoring `DEFAULT_IMAGE` (recipe.service.ts).
 *
 * Selecting through the button matters: `openFilePicker()` calls `markAsTouched()`, and the
 * `mat-error` is only projected into the DOM once `errorState` is true, which needs the control
 * to be *touched* (the default `ErrorStateMatcher` ignores `dirty`). Driving the hidden input
 * with `setInputFiles()` alone would leave it dirty-but-untouched and the error invisible
 * (plan H13).
 *
 * `setDisabledState` on the file input has no UI path in the app (grep: nothing disables the
 * `photo` control) and is covered by `file-input.component.spec.ts` instead — see plan §4.6.
 */
// The specs are transpiled to CommonJS (package.json has no "type": "module"), so __dirname
// is available and import.meta is not.
const FIXTURES_DIR = __dirname;
const SAMPLE_PNG = path.join(FIXTURES_DIR, 'fixtures', 'sample.png');
const SAMPLE_TXT = path.join(FIXTURES_DIR, 'fixtures', 'sample.txt');

/** Picks a file through the browse button, the same way a user would (no OS dialog shows). */
async function selectFile(page: Page, file: string): Promise<void> {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByTestId('file-input-browse').click(),
  ]);
  await chooser.setFiles(file);
}

let uid = uniqueId();

test.beforeEach(() => {
  uid = uniqueId();
});

test.afterEach(async () => {
  await deleteRecipesWithTitle(uid);
});

test('a recipe without an uploaded picture shows the default image and deletes cleanly', async ({
  page,
  consoleErrors,
}) => {
  const title = `Receta sin imagen ${uid}`;
  const ownerId = await ensureUser(E2E_USER.email, E2E_USER.password);
  const recipeId = await seedRecipe({ title, ownerId });

  await signIn(page);
  await page.goto(`/recipes/details/${recipeId}`);

  // `imgSrc: ''` goes through the converter (`docData.imgSrc ? … : DEFAULT_IMAGE`).
  await expect(page.getByTestId('recipe-details-title')).toHaveText(title);
  await expect(page.locator('img.recipe-details__image')).toHaveAttribute(
    'src',
    /verduras\.jpeg/,
  );

  // Deleting must ignore DEFAULT_IMAGE (recipe.service.ts:267): the chain still navigates back
  // to the list and no Storage error reaches the console.
  await page.getByRole('button', { name: 'Borrar' }).click();
  await page.getByTestId('dialog-confirm').click();

  await expect(page).toHaveURL(/\/recipes$/);
  expectNoConsoleErrors(consoleErrors);
});

test('uploads a picture to the emulator and keeps it through category changes', async ({
  page,
  consoleErrors,
}) => {
  const title = `Receta con imagen ${uid}`;
  const ownerId = await ensureUser(E2E_USER.email, E2E_USER.password);
  const category = { id: `p5-${uid}`, detail: `Categoría p5 ${uid}` };
  await seedCategory(category.id, category.detail);

  await signIn(page);
  await page.goto('/recipes/new');

  // Selecting the file fills the display input and renders the local preview.
  await selectFile(page, SAMPLE_PNG);
  await expect(page.getByTestId('file-input-display')).toHaveValue('sample.png');
  await expect(page.getByTestId('picture-preview')).toBeVisible();
  await expect(page.getByTestId('picture-upload')).toBeEnabled();

  // Changing the category (and closing the panel) must not wipe the picture field.
  await page.getByTestId('category-filter').click();
  const option = page.getByRole('option', { name: category.detail, exact: true });
  await option.click();
  await page.keyboard.press('Escape');
  await expect(option).toBeHidden();
  await expect(page.getByTestId('file-input-display')).toHaveValue('sample.png');
  await expect(page.getByTestId('picture-preview')).toBeVisible();

  // Upload to the Storage emulator. `submitted()` is set synchronously on click, so the
  // progress bar is in the DOM before this assertion runs: waiting for it to disappear means
  // the upload finished (and, if it was instant, it was never rendered — also fine).
  await page.getByTestId('picture-upload').click();
  await expect(page.locator('mat-progress-bar')).toBeHidden();

  await page.getByTestId('form-title').fill(title);
  await page.getByTestId('form-description').fill(`Descripción ${uid}`);
  await page.getByTestId('form-submit').click();
  await expect(page).toHaveURL(/\/recipes\/my-recipes$/);

  await renderAllCards(page);
  await page
    .getByTestId('recipe-card')
    .filter({ hasText: title })
    .getByTestId('recipe-view')
    .click();

  // The uploaded picture comes back as a Storage emulator URL, not the default asset.
  await expect(page.getByTestId('recipe-details-title')).toHaveText(title);
  await expect(page.locator('img.recipe-details__image')).toHaveAttribute('src', /9199/);

  expectNoConsoleErrors(consoleErrors);
});

test('gates "Subir imagen" on the required field and the image validator', async ({
  page,
  consoleErrors,
}) => {
  await signIn(page);
  await page.goto('/recipes/new');

  // Required: no file yet -> the upload button is disabled.
  await expect(page.getByTestId('picture-upload')).toBeDisabled();
  await expect(page.getByText('Formato de archivo incorrecto')).toHaveCount(0);

  // imageValidator: a non-image file paints the error and keeps the button disabled. Going
  // through the browse button marks the control touched, which is what makes `errorState`
  // true and projects the `<mat-error>` (H13).
  await selectFile(page, SAMPLE_TXT);
  await expect(page.getByText('Formato de archivo incorrecto')).toBeVisible();
  await expect(page.getByTestId('picture-upload')).toBeDisabled();
  await expect(page.getByTestId('file-input-display')).toHaveValue('sample.txt');

  // A valid image clears the error and enables the button.
  await selectFile(page, SAMPLE_PNG);
  await expect(page.getByText('Formato de archivo incorrecto')).toHaveCount(0);
  await expect(page.getByTestId('picture-upload')).toBeEnabled();
  await expect(page.getByTestId('file-input-display')).toHaveValue('sample.png');

  expectNoConsoleErrors(consoleErrors);
});
