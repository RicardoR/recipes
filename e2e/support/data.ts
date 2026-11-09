/**
 * Helpers to seed/inspect the Firebase emulators over their REST APIs.
 * Specs never talk REST directly: they import these helpers from `e2e/support/data`.
 */

const AUTH_EMULATOR = 'http://localhost:9099';
const FIRESTORE_EMULATOR = 'http://localhost:8080';
const PROJECT_ID = 'demo-recipes';

const FIRESTORE_DOCUMENTS_URL = `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Returns a token unique to the current invocation. Specs that seed or create data tag their
 * documents with it (usually inside the title) so they can assert about — and clean up —
 * *their own* documents while other specs run in parallel against the same emulator (D8).
 */
export function uniqueId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Users seeded in the auth emulator by `global-setup.ts`. */
export const E2E_USER = { email: 'e2e@example.com', password: '123456' };
export const DEMO_USER = { email: 'test@mail.com', password: '123456' };

type FieldValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { arrayValue: { values: FieldValue[] } }
  | { mapValue: { fields: Record<string, FieldValue> } };

async function authCall(path: string, body: Record<string, unknown>): Promise<{ status: number; json: Record<string, any> }> {
  const response = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/${path}?key=any`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return { status: response.status, json: await response.json().catch(() => ({})) };
}

/**
 * Makes sure `email`/`password` exist in the auth emulator and returns its `localId` (uid).
 * Signs in first so repeated runs do not fail with `EMAIL_EXISTS`.
 */
export async function ensureUser(email: string, password: string): Promise<string> {
  const signIn = await authCall('accounts:signInWithPassword', {
    email,
    password,
    returnSecureToken: true,
  });
  if (signIn.status === 200 && signIn.json.localId) {
    return signIn.json.localId as string;
  }

  const signUp = await authCall('accounts:signUp', { email, password, returnSecureToken: true });
  if (signUp.status === 200 && signUp.json.localId) {
    return signUp.json.localId;
  }

  throw new Error(
    `Could not create emulator user ${email}: ${signUp.status} ${JSON.stringify(signUp.json)}`,
  );
}

/** Waits until the emulators are actually serving (not only listening on their ports). */
export async function waitForEmulators(timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  const authReady = async (): Promise<boolean> => isHttpOk(`${AUTH_EMULATOR}/`);
  const firestoreReady = async (): Promise<boolean> => {
    if (!(await isHttpOk(`${FIRESTORE_EMULATOR}/`))) {
      return false;
    }
    // A real data operation: the HTTP endpoint can answer before the emulator serves queries,
    // and the app logs a console error if its first Firestore connection fails (it retries, but
    // the clean-console assertion would flake).
    try {
      const response = await fetch(`${FIRESTORE_DOCUMENTS_URL}/recipes?pageSize=1`, {
        headers: { Authorization: 'Bearer owner' },
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const checks: Array<[string, () => Promise<boolean>]> = [
    ['auth', authReady],
    ['firestore', firestoreReady],
  ];

  for (;;) {
    const results = await Promise.all(checks.map(([, check]) => check()));
    if (results.every(Boolean)) {
      return;
    }
    if (Date.now() > deadline) {
      const missing = checks.filter((_, index) => !results[index]).map(([name]) => name);
      throw new Error(`Firebase emulators not ready: ${missing.join(', ')}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function isHttpOk(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Deletes every document of the collections the app uses (`recipes`, `categories`).
 * The Firestore emulator has no `clear` HTTP endpoint, so documents are listed and deleted
 * one by one. Sub-collections of deleted documents are not covered (the app does not use any).
 */
export async function clearFirestore(): Promise<void> {
  for (const collection of ['recipes', 'categories']) {
    const response = await fetch(`${FIRESTORE_DOCUMENTS_URL}/${collection}?pageSize=300`, {
      headers: { Authorization: 'Bearer owner' },
    });
    if (!response.ok) {
      throw new Error(`clearFirestore: listing ${collection} failed: ${response.status}`);
    }
    const json = await response.json();
    const names: string[] = (json.documents ?? []).map((document: { name: string }) => document.name);

    for (const name of names) {
      const deleteResponse = await fetch(`${FIRESTORE_EMULATOR}/v1/${name}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer owner' },
      });
      if (!deleteResponse.ok) {
        throw new Error(`clearFirestore: deleting ${name} failed: ${deleteResponse.status}`);
      }
    }
  }
}

export interface SeedRecipeInput {
  title: string;
  description?: string;
  ownerId?: string;
  private?: boolean;
  imgSrc?: string;
  steps?: string[];
  ingredients?: string[];
  categories?: { id: string; detail: string }[];
  date?: Date;
}

/** Creates a recipe document and returns its Firestore id. */
export async function seedRecipe(input: SeedRecipeInput): Promise<string> {
  const documentId = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fields: Record<string, FieldValue> = {
    // `createRecipe` also writes the id into the document (`{...recipe, id: docRef.id}`) and
    // `getRecipeDetail` queries by that field, so the seed has to mirror it.
    id: { stringValue: documentId },
    date: { timestampValue: (input.date ?? new Date()).toISOString() },
    title: { stringValue: input.title },
    description: { stringValue: input.description ?? 'Descripción de prueba' },
    ownerId: { stringValue: input.ownerId ?? '' },
    steps: { arrayValue: { values: (input.steps ?? ['Paso 1']).map((s) => ({ stringValue: s })) } },
    ingredients: {
      arrayValue: { values: (input.ingredients ?? ['Ingrediente 1']).map((i) => ({ stringValue: i })) },
    },
    imgSrc: { stringValue: input.imgSrc ?? '' },
    private: { booleanValue: input.private ?? false },
    categories: {
      arrayValue: {
        values: (input.categories ?? []).map((category) => ({
          mapValue: {
            fields: {
              id: { stringValue: category.id },
              detail: { stringValue: category.detail },
            },
          },
        })),
      },
    },
  };

  // Firestore REST has no "create" verb: PATCH on the full document path (+ documentId query
  // param) creates it.
  const response = await fetch(
    `${FIRESTORE_DOCUMENTS_URL}/recipes/${documentId}?documentId=${documentId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ fields }),
    },
  );
  if (!response.ok) {
    throw new Error(`seedRecipe failed: ${response.status} ${await response.text()}`);
  }
  return documentId;
}

/**
 * Creates a category document (`{id, detail}` — the shape `elementModelConverter` expects) and
 * returns it. `id` is written as a string on purpose: `RecipeListComponent` matches the selected
 * categories against `recipe.categories` with `===`, and `seedRecipe` writes category ids as
 * strings too.
 */
export async function seedCategory(id: string, detail: string): Promise<void> {
  const response = await fetch(
    `${FIRESTORE_DOCUMENTS_URL}/categories/${id}?documentId=${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: { id: { stringValue: id }, detail: { stringValue: detail } },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`seedCategory failed: ${response.status} ${await response.text()}`);
  }
}

/**
 * Deletes every recipe document whose title contains `tag` — the cleanup for write specs.
 *
 * Replaces the "clearFirestore() in beforeEach" of plan §4.5: specs run in parallel against one
 * shared emulator (D7), so a global wipe would destroy the data of the specs running at the
 * same time. Each write spec tags its documents with `uniqueId()` and cleans only those (D8).
 */
export async function deleteRecipesWithTitle(tag: string): Promise<void> {
  const response = await fetch(`${FIRESTORE_DOCUMENTS_URL}/recipes?pageSize=300`, {
    headers: { Authorization: 'Bearer owner' },
  });
  if (!response.ok) {
    throw new Error(`deleteRecipesWithTitle: listing failed: ${response.status}`);
  }
  const json = await response.json();
  const matches = (json.documents ?? []).filter(
    (document: { fields?: { title?: { stringValue?: string } } }) =>
      document.fields?.title?.stringValue?.includes(tag) ?? false,
  );

  for (const document of matches as Array<{ name: string }>) {
    const deleteResponse = await fetch(`${FIRESTORE_EMULATOR}/v1/${document.name}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer owner' },
    });
    if (!deleteResponse.ok) {
      throw new Error(`deleteRecipesWithTitle: deleting failed: ${deleteResponse.status}`);
    }
  }
}
