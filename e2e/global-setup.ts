import { DEMO_USER, E2E_USER, clearFirestore, clearStorage, ensureUser, waitForEmulators } from './support/data';

/**
 * Runs once before the whole e2e suite (after Playwright has started the emulators).
 * Waits for the emulators and seeds the two users the app needs:
 *
 * - `e2e@example.com`: regular user, used for CRUD specs (mutations with the demo user throw).
 * - `test@mail.com`:   the demo user (`FAKE_USER_EMAIL`), pre-filled in the login form.
 */
// Playwright passes the resolved config, but this setup does not need it.
export default async function globalSetup(): Promise<void> {
  await waitForEmulators();
  // Deterministic starting point: every spec assumes an empty firestore emulator (and an empty
  // Storage bucket, so leftover uploads from previous runs do not accumulate).
  await clearFirestore();
  await clearStorage();
  await ensureUser(E2E_USER.email, E2E_USER.password);
  await ensureUser(DEMO_USER.email, DEMO_USER.password);
}
