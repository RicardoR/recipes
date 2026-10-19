# AGENTS.md

Angular 21 standalone app (single project `recipes`) for managing recipes with Firebase
(Firestore + Storage + Auth + Analytics). UI strings are **Spanish**; code, comments and commit
messages are English. Node 22+.

## Setup: environment files are generated, not committed

`src/environments/` is **gitignored**. A fresh clone has no env files and the build/test fails with
`TS2307: Cannot find module 'src/environments/environment'`.

Generate them first:

```bash
node server.js   # needs env vars FIREBASE_DETAILS and FIREBASE_DETAILS_TEST
```

`server.js` writes the **raw content** of those env vars into three files:

| file | source | used by |
| --- | --- | --- |
| `environment.ts` | `FIREBASE_DETAILS` | placeholder only (always replaced at build) |
| `environment.prod.ts` | `FIREBASE_DETAILS` | `ng build` (default `production` config) |
| `environment.debugMode.ts` | `FIREBASE_DETAILS_TEST` | `ng serve` (`development`), `ng build --configuration debugMode`, **and the unit-test build** |

So local dev/test points at the *test* Firebase project while `ng build` / `npm run deploy` points
at the production one. Never hand-edit these files — they are overwritten.

`src/environments/environment.tst.ts` (`useEmulators: true`) exists but is **not** referenced by any
`fileReplacements` in `angular.json`; using the local emulators requires swapping it in manually or
adding a new configuration.

## Commands

```bash
npm start                              # ng serve, port 4200
npm run start:debugMode                # ng serve --configuration=debugMode (debugMode: true)
npm run build                          # ng build -> dist/recipes/browser
npm test                               # ng test (Vitest)
npm run test-coverage                  # ng test --coverage
npm run lint                           # ng lint (angular-eslint, ts + html)
npm run deploy                         # ng build && firebase deploy
npm run firebase:emulators:start      # auth 9099, firestore 8080, storage 9199, UI 4000
```

### Focused verification

```bash
npx ng test --watch=false --include="src/app/app.component.spec.ts"   # one spec file
npx ng test --watch=false --filter="^RecipeService"                    # by suite/test name regex
npx ng test --list-tests                                                 # list discovered specs
```

`--watch` defaults to **true in a TTY**; always pass `--watch=false` for scripted/CI runs.
Full suite is fast (~15s, 23 files / 120 tests). No `--browsers` is set, so tests run in **jsdom**,
not a real browser.

## Architecture

`src/main.ts` -> `app/app.config.ts` (providers: Firebase app, Firestore, Auth, Analytics, Storage,
Router, Material snack bar, `LOCALE_ID: 'es'`, `AppErrorHandler`; service worker registered only
when `environment.production`) -> `AppComponent`.

Feature-first layout under `src/app`:

- `core/auth/` — `AuthService`, `AuthReadyGuard` / `AuthGuard`, login component, `auth.routes.ts`
- `features/recipes/` — recipe components, `PrivateRecipeGuard`, `models/`, `services/recipe/recipe.service.ts`, `recipes.routes.ts`
- `shared/` — reusable components (`recipe-card-form`, `recipe-list`, `recipe-ribbon`,
  `recipes-multiple-select`, `toolbar`), services (`analytics`, `messages`, `toolbar`), `utils/`
- `testing-resources/mocks/` — shared mock fixtures used across specs

Routing (`app.routes.ts`): `recipes` (lazy -> `features/recipes/recipes.routes.ts`, gated by
`AuthReadyGuard`) and `login` (lazy -> `core/auth/auth.routes.ts`); `**` redirects to `recipes`.

Firebase SDK usage is **mixed**: `app.config.ts` and `recipe.service.ts` use the modular API
(`provideFirestore`, `getDocs`, `collection`, ...), while `auth.service.ts` uses the compat API
(`AngularFireAuth` from `@angular/fire/compat/auth`). Keep that mix in mind when touching auth.

### Data model

Firestore collections (const enum `DatabaseCollectionsNames` in `recipe.service.ts`): `recipes`,
`categories`. Recipe document fields: `date` (Timestamp), `title`, `description`, `id` (also
written into the doc by `createRecipe`), `ownerId`, `steps`, `ingredients`, `imgSrc`, `private`,
`categories`. Missing `imgSrc` falls back to `DEFAULT_IMAGE = 'assets/images/verduras.jpeg'`, which
`deleteImage` refuses to delete.

### Demo user

`FAKE_USER_EMAIL = 'test@mail.com'` (in `auth.service.ts`); the login form is pre-filled with it.
The demo user can browse but `createRecipe`, `updateRecipe`, `deleteRecipe`,
`uploadFileAndGetMetadata` and `deleteImage` **throw synchronously** (not via an observable error).

## Testing conventions

- Vitest (not Karma). `vi` is imported explicitly from `'vitest'`; globals are enabled through
  `tsconfig.spec.json` (`types: ["vitest/globals"]`).
- Specs are colocated with the source: `*.component.spec.ts`, `*.service.spec.ts`, `*.guard.spec.ts`.
- Shared mocks live in `src/app/testing-resources/mocks/` and are imported via the absolute path
  form `src/app/...` (`baseUrl: "./"` in `tsconfig.json` makes this work — 56 such imports).
- Service specs stub `Firestore` / `Storage` with empty objects and `vi.spyOn` the service methods;
  **no spec talks to Firebase**, so no emulator is needed to run the suite.
- Component specs commonly call `.overrideTemplate(Component, '')` to skip the template.
- File-name mismatch to be aware of: `shared/components/recipes-multiple-select/` contains
  `recipes-multiple-select.component.ts` but `recipes-select.component.spec.ts`.

## Lint / style

- `eslint.config.js` (angular-eslint flat config). Component selectors **must** be `app-<kebab-case>`,
  directive selectors `app< camelCase>` — the lint rules error out otherwise.
- Templates are linted with `templateAccessibility` enabled, so a11y violations fail `npm run lint`.
- `.editorconfig`: 2-space indent, **single quotes** in `.ts`, final newline, trim trailing whitespace.
- No Prettier config in the repo — match surrounding style manually.

## CI

`.github/workflows/node.js.yml` (push/PR to `master`, Node 22.x) runs, in order:
`node server.js` (with the `FIREBASE_DETAILS` / `FIREBASE_DETAILS_TEST` secrets) ->
`npm ci --legacy-peer-deps` -> `npm run build --if-present` -> `npm test`.

The `--legacy-peer-deps` flag is needed because `@ngxmc/file-input@20.1.0` declares peer deps on
Angular `^20` while the project is on Angular 21; `package.json` `overrides` additionally pins that
package's Angular peers to v21. Expect peer-dep noise when touching that dependency.
