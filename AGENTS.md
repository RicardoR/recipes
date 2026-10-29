# AGENTS.md

Angular 22.2.3 standalone app (single project `recipes`) for managing recipes with Firebase
(Firestore + Storage + Auth + Analytics). UI strings are **Spanish**; code, comments and commit
messages are English. Node 22+.

## Where the guidance lives

- **Angular guidance is vendored in the repo**: `.agents/skills/angular-developer/SKILL.md` (+ a
  `references/` folder) is committed and pinned by `skills-lock.json`. Load that skill for any
  Angular work (signals, inputs, DI, forms, routing, testing) instead of inventing generic advice.
- **Implementation plans live in `plan/`** as `plan/<issue-number>-<slug>.md`, written in **Spanish**,
  with a phase-by-phase progress table at the top. Current example: `plan/73-replace-ngxmc-file-input.md`.

## Setup: environment files are generated, not committed

`src/environments/` is **gitignored**. A fresh clone has no env files and the build/test fails with
`TS2307: Cannot find module 'src/environments/environment'`.

Generate them first:

```bash
node server.js   # needs env vars FIREBASE_DETAILS and FIREBASE_DETAILS_TEST
```

`server.js` writes four files (the first three from the **raw content** of those env vars, the
fourth hard-coded):

| file | source | used by |
| --- | --- | --- |
| `environment.ts` | `FIREBASE_DETAILS` | placeholder only (always replaced at build) |
| `environment.prod.ts` | `FIREBASE_DETAILS` | `ng build` (default `production` config) |
| `environment.debugMode.ts` | `FIREBASE_DETAILS_TEST` | `ng serve` (`development`), `ng build --configuration debugMode` |
| `environment.test.ts` | hard-coded by `server.js` (`useEmulators: true`, `demo-recipes` project) | the unit-test build (`test` target → `recipes:build:test` in `angular.json`) |

So local dev/test points at the *test* Firebase project (or the emulators, for the unit-test
build) while `ng build` / `npm run deploy` points at the production one. Never hand-edit these
files — they are overwritten.

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
Full suite takes on the order of **~1 min cold / ~15-40s warm** (24 files / 135 tests). No
`--browsers` is set, so tests run in **jsdom**, not a real browser. There is **no e2e setup** in the
repo (no e2e target, no e2e runner installed).

Tests run isolated per spec file: `vitest-base.config.mts` (loaded via the `runnerConfig` option of
the `test` target in `angular.json`) sets `isolate: true`, overriding the `@angular/build:unit-test`
builder default of `isolate: false`. Without it, `vi.mock(...)` becomes execution-order dependent
(the module registry is shared across specs) and fails only on full-suite runs.

## Architecture

`src/main.ts` -> `app/app.config.ts` (providers: Firebase app, Firestore, Auth, Analytics, Storage,
Router, Material snack bar, `LOCALE_ID: 'es'`, `AppErrorHandler`; service worker registered only
when `environment.production`) -> `AppComponent`.

Feature-first layout under `src/app`:

- `core/auth/` — `AuthService`, `AuthReadyGuard` / `AuthGuard`, login component, `auth.routes.ts`
- `features/recipes/` — recipe components, `PrivateRecipeGuard`, `models/`, `services/recipe/recipe.service.ts`, `recipes.routes.ts`
- `shared/` — reusable components (`file-input`, `recipe-card-form`, `recipe-list`, `recipe-ribbon`,
  `recipes-multiple-select`, `toolbar`), services (`analytics`, `messages`, `toolbar`), `utils/`
- `testing-resources/mocks/` — shared mock fixtures used across specs

`shared/components/file-input/` is a **home-grown replacement for the removed `@ngxmc/file-input`**
package (dropped in issue #73 because it only declared Angular 20 peer deps). It implements
`MatFormFieldControl` + `ControlValueAccessor`, mixes legacy `@Input()` with signal `input()`,
and projects its icon through the plain attribute `appFileInputIcon`
(`<ng-content select="[appFileInputIcon]">`). Do not look for the third-party library.

Routing (`app.routes.ts`): `recipes` (lazy -> `features/recipes/recipes.routes.ts`, gated by
`AuthReadyGuard`) and `login` (lazy -> `core/auth/auth.routes.ts`); `**` redirects to `recipes`.

Firebase SDK usage is **fully modular** everywhere: `app.config.ts`, `recipe.service.ts` and
`auth.service.ts` all use the modular API (`provideFirestore`, `getDocs`, `collection`,
`onAuthStateChanged`, `signInWithEmailAndPassword`, ...). Auth is injected through the
`FIREBASE_AUTH` token from `core/firebase/firebase.providers.ts`; `@angular/fire` is **not** in
`package.json`.

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
- Service specs stub the Firebase `InjectionToken`s (`FIRESTORE`, `FIREBASE_STORAGE`,
  `FIREBASE_AUTH` from `core/firebase/firebase.providers.ts`) with empty objects and `vi.spyOn` the
  service methods; **no spec talks to Firebase**, so no emulator is needed to run the suite.
- `auth.service.spec.ts` mocks the modular SDK free functions with `vi.hoisted` + `vi.mock('firebase/auth')`.
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
`yarn install --frozen-lockfile` -> `yarn build` -> `yarn test`.

The repo uses **Yarn 1.x** and tracks `yarn.lock` (lockfiles are **not** gitignored); the workflow
caches with `cache: 'yarn'`. Install with yarn, not npm: `package.json` uses `resolutions` (a
yarn-1-only field pinning `@jridgewell/sourcemap-codec`) which npm silently ignores — regenerating
a `package-lock.json` would drop that pin.

