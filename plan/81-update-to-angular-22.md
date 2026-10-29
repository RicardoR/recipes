# Plan — Issue #81: Update to Angular 22

> Objetivo: cerrar la actualización a **Angular 22** en la rama `ng-22-update` dejando el repo en un
> estado **verde y reproducible**: dependencias alineadas, CI funcionando, sin APIs deprecadas ni
> funcionalidades anticuadas de Angular/Material, y la deuda restante trazada en issues de seguimiento.
>
> Todo lo que sigue procede de una auditoría completa hecha antes de abrir la PR (verificación empírica
> con `ng update`, `npm outdated`, extracción de tarballs, inspección de types/schematics instalados y
> ejecución de `build`/`test`/`lint`).

Repo: `RicardoR/recipes` · Issue: https://github.com/RicardoR/recipes/issues/81

---

## 0. Progreso de la implementación

Rama: `ng-22-update`

| Fase | Tarea | Prioridad | Estado | Notas |
|---|---|---|---|---|
| **F0** | Baseline Angular 22 + verificación | — | ✅ | core 22.2.3 · cli/build 22.2.4 · angular-eslint 22.6.0 · TS 6.0.3 · Vitest 5.0.5. `build` ✅ 1.54 MB (< 2 MB budget) · `test` ✅ 24 ficheros / 135 tests · `lint` ✅ 0 errores / 14 warnings (regla `prefer-on-push` bajada a `"warn"` en `eslint.config.js:33`) |
| **F1** | **P0**: reproducibilidad — commitear `yarn.lock` + arreglar workflow CI (yarn) | P0 | ✅ | `yarn.lock` trackeado y `.gitignore` sin ignorar lockfiles; workflow con `cache: 'yarn'` + `yarn install --frozen-lockfile` + `yarn build` / `yarn test`. Verificado localmente: `--frozen-lockfile` ✅ · `build` ✅ · `test` ✅ 24/135 |
| **F2** | **P1**: `@angular/material` + `@angular/cdk` 21.0.6 → 22.2.5 | P1 | ✅ | Bump puro vía `ng update @angular/material` (migraciones v22 vacías: "No changes made"). Subido a **22.2.5** (no 22.2.4 del plan: había patch más nuevo y 22.2.4 dejaría ping de pendiente). `build` ✅ 1.56 MB · `test` ✅ 24/135. Queda ping menor de `@angular/cli` 22.2.4→22.2.5 (fuera de F2). Ver §3 |
| **F3** | **P1**: actualizar `AGENTS.md` (afirmaciones falsas) | P1 | ✅ | Angular 22.2.3 · auth **modular** total (`FIREBASE_AUTH`, sin `@angular/fire`) · CI yarn · tabla de 4 env files (`environment.test.ts` → build de tests) · borrada la mención a `environment.tst.ts` (no existe) · tiempos de suite ~1 min frío / 15-40s caliente. Hechos verificados contra `server.js`, `angular.json` y `auth.service.ts`. Ver §4 |
| **F4** | **P1**: limpieza de dependencias sin uso / mal ubicadas | P1 | ✅ | Borrados `@angular/platform-browser-dynamic` (0 usos en src/configs/CI) y `@vitest/browser-playwright` (solo si `browsers` opcional, aquí jsdom); `@vitest/coverage-v8` → devDeps pineado a `5.0.5` (quitado `^`). Verificado: `build` ✅ 1.56 MB · `test` ✅ 24/135 · `test-coverage` ✅ v8. Ver §5 |
| **F5** | **P2**: micro-limpieza (archivos muertos, tema duplicado, `packageManager`, parches) | P2 | ✅ | Pts 1-5 hechos: borrado `src/polyfills.ts` (huérfano) · eliminado el `@use` duplicado del tema M2 en `styles.scss` (bundle **idéntico**: 103.920 B, 1 copia, offset 2825 — se conserva la entrada de `angular.json`) · `vitest-base.config.ts` → `.mts` (sin warning ESM/CJS) · `packageManager: yarn@1.22.19` + arreglado `"test": "ng test "` · zone.js 0.15.1 → 0.16.3. `build` ✅ 1.57 MB · `test` ✅ 24/135. Pts 6-7 (parches typescript-eslint/jsdom/@types-node y `resolutions`) opcionales, **pendientes**. Ver §6 |
| **F6** | **P2**: `app.config.ts` — `provideBrowserGlobalErrorListeners()` + quitar `importProvidersFrom(BrowserModule)` | P2 | ✅ | Añadido `provideBrowserGlobalErrorListeners()` (listeners `window` `error`/`unhandledrejection` → `AppErrorHandler`; verificado en `_pending_tasks-chunk.mjs` que `bootstrapApplication` NO lo incluye). Quitado `BrowserModule` (redundante: `createProvidersConfig` en `_browser-chunk.mjs` ya mezcla `BROWSER_MODULE_PROVIDERS`). `build` ✅ 1.56 MB · `test` ✅ 24/135. Smoke manual: error síncrono → snackbar ✅; `Promise.reject` → **no llega** por bug upstream de zone.js → trazado en **I5**. Ver §7 |
| **F7** | Smoke test final + criterios de aceptación | — | ✅ | `build` ✅ 1.57 MB · `test` ✅ 24/135 · `lint` ✅ 0 errores (14 warnings I1) · `ng update` **sin pendientes** (aplicados core 22.2.3→22.2.4 y cli/build 22.2.4→22.2.5, parches que F2 dejó pendientes). Smoke manual CRUD por el usuario ✅ + errores globales (sync ✅ / rejections → I5). §10 revisado íntegro |
| **(I1)** | Issue: migración de los 14 `ChangeDetectionStrategy.Eager` → OnPush | P2 | ✅ **#83** | No bloquea la PR (CI no corre lint). Texto en §8 |
| **(I2)** | Issue: firebase 11.9.0 → 13.1.0 | P2 | ✅ **#84** | Diferible con alta confianza. Texto en §8 |
| **(I3)** | Issue: modernizar `tsconfig.json` (`module: "preserve"` + `isolatedModules`) | P3 | 📄 texto entregado | Probado y verde, revertido. Texto en §8 |
| **(I4)** | Issue: terminar migración a signal inputs en `file-input` | P3 | ✅ **#86** | 5 `@Input()` legacy. Texto en §8 |
| **(I5)** | Issue: `Promise` rechazados sin catch no llegan a `AppErrorHandler` (bug upstream zone.js) | P2 | 📄 texto entregado | No bloquea la PR (el camino de errores síncronos funciona). Diagnóstico empírico A/B en §8 |

---

## 1. Alcance de esta PR vs issues de seguimiento

**Entra en la PR de #81** (F1–F7): reproducibilidad del CI, Material/CDK 22, AGENTS.md, deps sin uso y
limpiezas baratas. Es decir: que "Angular 22" quede *completo y verificado*.

**Queda fuera, en issues aparte** (I1–I4): migración a OnPush (cambio de comportamiento real por
componente), firebase v13, tsconfig moderno y signal inputs. Son mejoras incrementales que no tienen
por qué bloquear el upgrade.

---

## 2. F1 (P0) — El repo no tiene NINGÚN lockfile commitado y el CI está roto

Evidencia:

- `git ls-files | grep -iE "yarn|lock"` → solo `skills-lock.json`. **Ni `package-lock.json` ni
  `yarn.lock` están trackeados.**
- `.gitignore:52` ignora `yarn.lock` y `.gitignore:57` ignora `package-lock.json` (este último se añadió
  **en esta rama**, `git diff master...HEAD -- .gitignore`).
- `.github/workflows/node.js.yml:28` → `cache: 'npm'`: `actions/setup-node` falla antes de nada con
  *"Dependencies lock file is not found"*.
- `.github/workflows/node.js.yml:33` → `npm ci`: fallaría con *"can only install with an existing
  package-lock.json"*.
- `package.json:48-50` usa `resolutions` (campo **solo yarn 1**); npm lo ignora (su equivalente es
  `overrides`) ⇒ regenerar `package-lock.json` perdería silenciosamente el pin
  `@jridgewell/sourcemap-codec: 1.6.0`.
- `yarn --version` local → `1.22.19` (los runners de GitHub traen yarn 1.22.x, misma línea).

**Acción (esfuerzo S):**

1. Quitar `yarn.lock` de `.gitignore` y commitear el `yarn.lock` actual.
2. Workflow: `cache: 'yarn'` + `yarn install --frozen-lockfile` en lugar de `cache: 'npm'` + `npm ci`.
3. (Alternativa npm, no recomendada): revertir el `.gitignore`, regenerar `package-lock.json` y
   convertir `resolutions` → `overrides`.

---

## 3. F2 (P1) — Material/CDK 21.0.6 → 22.2.4

- `npx ng update` → único pendiente: `@angular/material 21.0.6 -> 22.2.4`.
- Peers hoy válidos (`"@angular/core": "^21.0.0 || ^22.0.0"`) ⇒ "funciona" pero es incoherente y
  `ng update` va a seguir pingueando siempre.
- **Verificado extrayendo los tarballs** de `@angular/material@22.2.4` y `@angular/cdk@22.2.4`:
  `schematics/migration.json` de v22 → `const materialMigrations = []` / `const cdkMigrations = []`
  (**listas vacías**) ⇒ `ng update @angular/material` es un **bump puro, sin rewrites de código**.
- Breaking changes de Material/CDK 22 (`MatListOption.checkboxPosition` eliminado, legacy combobox
  eliminado, `ConfigurableFocusTrap` con injector obligatorio, cambios en menu/list/sort/a11y) →
  **ninguno se usa aquí**: grep de `src/` por `checkboxPosition|ContextMenuTracker|CDK_DESCRIBEDBY|
  FocusTrap|matSort|mat-table|MatLegacy|mat-autocomplete` → 0 hits. Solo se usan
  `[matMenuTriggerFor]` y `MatSnackBar.open()`.
- **Los temas M2 prebuilt NO se eliminan en v22**: el tarball 22.2.4 sigue incluyendo
  `prebuilt-themes/purple-green.css` (107.900 bytes vs 101.767 en 21.0.6). Solo se deprecia la API
  *Sass* de theming, y aquí se consume el CSS prebuilt (`angular.json:46`), sin ningún
  `@use '@angular/material/theming'` en `src/styles*/`.

**Acción (esfuerzo S):** `ng update @angular/material` (sube material y cdk a 22.2.4) + smoke test
visual de dialog/menu/select/snackbar. Nota: `ng update` exige árbol git limpio (`--allow-dirty` si hay
cambios) y el package manager sale de la config global `~/.angular-config.json`.

---

## 4. F3 (P1) — `AGENTS.md` está materialmente desactualizado

| Línea(s) | Afirmación actual | Realidad |
|---|---|---|
| 3 | "Angular 21 standalone app" | Angular **22.2.3** |
| 95-96 | "`auth.service.ts` usa la compat API (`AngularFireAuth` de `@angular/fire/compat/auth`)" | Falso desde el commit `408cfff` (F4 del plan #76): es **modular** `firebase/auth` + token `FIREBASE_AUTH`; `@angular/fire` **no está** en `package.json` |
| 137-142 | CI con `npm ci` / "no `--legacy-peer-deps`" | Reescribir para **yarn** según F1 |
| 26-33 | Tabla de env files con **tres** ficheros | `server.js` escribe **cuatro** (añade `environment.test.ts`, usado por la config `recipes:build:test` de `angular.json:103-110`) |
| 37-39 | "`src/environments/environment.tst.ts` existe" | **No existe** (`ls src/environments/` → `environment.ts`, `environment.prod.ts`, `environment.debugMode.ts`, `environment.test.ts`) |
| 63 | Suite "~30s" | Medido: **57s frío / 15s caliente** |

**Acción (esfuerzo S):** corregir todo lo anterior en la misma PR.

---

## 5. F4 (P1) — Dependencias sin uso / mal ubicadas

| Paquete | Problema | Verificación | Acción |
|---|---|---|---|
| `@angular/platform-browser-dynamic` (package.json:25) | Sin uso | `grep -rn "platform-browser-dynamic" src/` → 0; nada en configs ni CI | Borrar |
| `@vitest/browser-playwright` (package.json:40) | Sin uso | Solo lo usa `@angular/build` si se pasa la opción `browsers` (`unit-test/runners/vitest/index.js:37-38`); los tests corren en jsdom (24× `Environment recipes jsdom was created`) | Borrar |
| `@vitest/coverage-v8` (package.json:28) | En `dependencies` en vez de `devDependencies`; único rango con `^` (`^5.0.5`) en un fichero todo pineado | Peer opcional de vitest | Mover a devDeps + pinear |

**Acción (esfuerzo S):** hacerlo en esta PR — el churn de dependencias es justamente el tema.

---

## 6. F5 (P2) — Micro-limpieza

1. **`src/polyfills.ts` huérfano**: la rama cambió a `polyfills: ["zone.js"]` en `angular.json:33` y lo
   sacó de los `files` del tsconfig; nadie lo referencia (además contiene comentarios de IE/Edge). → Borrar.
2. **Tema M2 incluido dos veces**: `angular.json:46` **y** `src/styles.scss:3`
   (`@use '...prebuilt-themes/purple-green.css'`). esbuild lo dedupe hoy (1 sola copia en el CSS de
   salida) → eliminar uno de los dos.
3. **`vitest-base.config.ts` → `vitest-base.config.mts`**: el build avisa
   *"ESM syntax in a file loaded as CommonJS"*; el builder ya incluye `vitest-base.config.mts` en su
   lista por defecto (`unit-test/runners/vitest/configuration.js:25-26`), así que el rename basta.
4. **`package.json`**: añadir `"packageManager": "yarn@1.22.19"` (corepack) — hoy no se declara el gestor
   en ningún sitio; arreglar el espacio final de `"test": "ng test "` (línea 11).
5. **zone.js 0.15.1 → 0.16.3**: dentro del peer range de core 22 (`~0.15.0 || ~0.16.0`). Bump seguro.
6. **Parches compatibles (verificado con peers/engines)**: `typescript-eslint` 8.72.0→8.72.1
   (peer `>=4.8.4 <6.1.0` ✅), `jsdom` 28→30 (engines `^22.22.2 || ^24.15.0 || >=26` → CI 22.x=22.23.4 ✅,
   local 24.22.0 ✅), `@types/node` 22→26 (peer de vitest `^22 || >=24` ✅).
7. **`resolutions: {"@jridgewell/sourcemap-codec": "1.6.0"}`**: puede quedarse o quitarse; dependientes
   (`@angular/compiler-cli`, `gen-mapping`, `magic-string`) resuelven a 1.6.0 igual hoy. Sin riesgo
   either way.

**Acción (esfuerzo S):** 1–5 en la PR si no ensucia la revisión; 6–7 opcionales.

---

## 7. F6 (P2) — `app.config.ts` / `main.ts` (verificado en los types de v22)

**No son deprecados (comprobar antes de tocar):**

- `enableProdMode()` → **no** `@deprecated` en v22 (`types/core.d.ts:9576`).
- `provideZoneChangeDetection()` → **no** `@deprecated` (`types/core.d.ts:3393`). El scaffold v22 lo
  pone en `app.config` con `{eventCoalescing: true}`; aquí está raramente en el spread del
  `bootstrapApplication` de `main.ts:11` — moverlo a `app.config` sería más canónico (opcional).
- `ServiceWorkerModule.register(...)` → **no** `@deprecated` (`types/service-worker.d.ts:228`); existe
  además `provideServiceWorker()` (`:219`) como equivalente moderno → swap opcional, no urgente.

**Sí conviene:**

1. **Añadir `provideBrowserGlobalErrorListeners()`** (incluido en el scaffold v22;
   `types/_debug_node-chunk.d.ts:3248`): **sin él, los eventos globales `window` `error` /
   `unhandledrejection` nunca llegan a tu `AppErrorHandler`**. Único punto de la auditoría con valor de
   comportamiento real. *(esfuerzo S)*
2. **Quitar `importProvidersFrom(BrowserModule)`** (`app.config.ts:27-28`): redundante bajo
   `bootstrapApplication`; el scaffold v22 nunca lo hace. *(esfuerzo S)*

---

## 8. Trabajo diferido a issues de seguimiento

### I1 — Migración OnPush (los 14 warnings de lint)

> Issue **#83** creada por el usuario el 2026-10-29: https://github.com/RicardoR/recipes/issues/83

- Causa confirmada: `@angular/core` 22 `schematics/migrations.json` → `22.0.0 change-detection-eager
  — Adds ChangeDetectionStrategy.Eager to all components`. Afecta a 12 componentes + 2 test-hosts
  (`src/app/shared/components/file-input/file-input.component.spec.ts:25,48`).
- `npm run lint` → `✖ 14 problems (0 errors, 14 warnings)`; regla en `"warn"` (`eslint.config.js:33`).
  **CI no corre lint** ⇒ no bloquea la PR.
- 3 componentes ya son OnPush (toolbar:32, recipe-ribbon:7, recipes-multiple-select:17). El texto de la
  issue está redactado abajo (3 tiers: seguros / medios / con trabajo real), listo para pegar.
- Esfuerzo: **M** — requiere testing por componente (cambio de comportamiento).

**Texto de la issue (listo para pegar):**

```markdown
## Contexto

La migración de Angular 22 `22.0.0 change-detection-eager` (schematic de `@angular/core`) añadió
`ChangeDetectionStrategy.Eager` a todos los componentes. El resultado es que `npm run lint` queda con
14 warnings de `@angular-eslint/prefer-on-push-component-change-detection`:

`✖ 14 problems (0 errors, 14 warnings)`

Para no bloquear la PR de #81 la regla se dejó en `"warn"` (`eslint.config.js:33`) y el CI no corre
lint. Esta issue es para migrar a OnPush y subir la regla a `"error"`.

## Inventario (14 avisos = 12 componentes + 2 test-hosts)

| Componente | Ubicación | Asignaciones `this.` | Streams/suscripciones | Tier |
|---|---|---|---|---|
| `AppComponent` | `src/app/app.component.ts:11` | 0 | 0 | 1 |
| `DeleteRecipeDialogComponent` | `delete-recipe-dialog.component.ts:10` | 0 | 0 | 1 |
| `RecipeLayoutComponent` | `recipe-layout.component.ts:12` | 0 | 0 | 1 |
| test-host de `file-input` | `file-input.component.spec.ts:25,48` | — | — | 1 |
| `LoginComponent` | `login.component.ts:22` | 1 | 0 | 2 |
| `NewRecipeComponent` | `new-recipe.component.ts:18` | 0 | 1 | 2 |
| `RecipeListComponent` | `recipe-list.component.ts:23` | 1 | 3 | 2 |
| `EditRecipeComponent` | `edit-recipe.component.ts:21` | 3 | 2 | 3 |
| `MyRecipesComponent` | `my-recipes.component.ts:24` | 7 | 2 | 3 |
| `PublicRecipeListComponent` | `public-recipe-list.component.ts:24` | 10 | 4 | 3 |
| `RecipeDetailsComponent` | `recipe-details.component.ts:28` | 3 | 2 | 3 |
| `FileInputComponent` | `file-input.component.ts:37` | 7 | 0 | 3 |
| `RecipeCardFormComponent` | `recipe-card-form.component.ts:58` | 12 | 4 | 3 |

(Las líneas son las de la rama `ng-22-update`. 3 componentes ya son OnPush: `toolbar`, `recipe-ribbon`,
`recipes-multiple-select`.)

## Plan por tiers (riesgo creciente)

**Tier 1 — seguros**: sin mutaciones de estado ni suscripciones → cambiar `Eager` por `OnPush` y nada
más. Los 2 test-hosts de `file-input.component.spec.ts` van igual: sus plantillas son triviales y los
tests lo validan.

**Tier 2 — revisar**: mutaciones mínimas, casi todas en handlers de eventos del propio template (bajo
OnPush un evento del template marca el componente, así que suelen ser seguros). Comprobar la única
suscripción de `new-recipe`: si la asignación viene de un `.subscribe` sin origen en el template,
añadir `markForCheck()`.

**Tier 3 — trabajo real**: estado mutable + suscripciones manuales (`.subscribe(res => this.x = ...)`).
Bajo OnPush la vista queda **stale** porque asignar un campo no marca el componente como dirty.
Opciones por componente: convertir el estado a **signals** (recomendado; el template ya se re-renderiza
solo) o `markForCheck()` en cada callback. Caso especial `FileInputComponent` (`MatFormFieldControl`):
cada mutación de estado del control debe emitir en `stateChanges` o el form field no se entera.

> Nota: la app corre con zone.js y `tick()` es global, pero eso **no** marca componentes OnPush como
> dirty; solo lo hacen inputs, eventos del propio template, escrituras de signals y `markForCheck()`.

## Criterios de aceptación

- [ ] `npm run lint` → **0 errores y 0 warnings**.
- [ ] Regla `prefer-on-push-component-change-detection` en `"error"` (`eslint.config.js:33`).
- [ ] `npx ng test --watch=false` ✅ 24 ficheros / 135 tests.
- [ ] Smoke manual de los Tier 3: las vistas se actualizan tras lo asíncrono (carga de receta, submit
      de formulario, listado filtrado, `file-input` escribiendo en el form).

## Esfuerzo

**M** — Tier 1/2 es mecánico; Tier 3 exige testing por componente (cambia comportamiento de
actualización).
```

### I2 — firebase 11.9.0 → 13.1.0 (diferible, alta confianza)

> Issue **#84** creada por el usuario el 2026-10-29: https://github.com/RicardoR/recipes/issues/84

- Verificado extrayendo `firebase@13.1.0` + `@firebase/*` internos: **todas** las funciones usadas por
  la app siguen presentes (`initializeApp`, `getFirestore/getAuth/getStorage/getAnalytics`,
  `onAuthStateChanged`, `signInWithEmailAndPassword`, `signOut`, `addDoc/collection/query/orderBy/where/
  doc/setDoc/updateDoc/deleteDoc/getDocs/Timestamp`, `ref/uploadBytesResumable/getDownloadURL/
  deleteObject`, `connectFirestoreEmulator/connectStorageEmulator`, `isSupported/logEvent`).
- Release notes v13.0.0 (2026-10-07): breaking changes confinados a **AI Logic** + añadidos de tipos en
  Firestore. v13.1.0 es un fix de Auth.
- Al terminar: test contra **emuladores** (el riesgo restante es conductual: persistencia de sesión de
  auth, tamaño de bundle, no de forma de API).
- Esfuerzo: **M**.

**Texto de la issue (listo para pegar):**

```markdown
## Contexto

`firebase` está en **11.9.0** y es la única dependencia grande que #81 dejó fuera (se priorizaron los
bumps de Angular/Material; era diferible con alta confianza). Dependabot reporta **151
vulnerabilidades** en la rama por defecto (8 críticas, 73 altas): conviene re-evaluar cuántas siguen
tras el upgrade de Angular 22 (PR #82) y bajar el SDK a la última.

## Ya verificado en la auditoría de #81 (no hace falta repetirlo)

- Tarball extraído de `firebase@13.1.0` + paquetes internos `@firebase/*`: **todas** las funciones que
  usa la app siguen presentes con el mismo formato:
  - `initializeApp`, `getFirestore`/`getAuth`/`getStorage`/`getAnalytics`
  - Auth: `onAuthStateChanged`, `signInWithEmailAndPassword`, `signOut`
  - Firestore: `addDoc`/`collection`/`query`/`orderBy`/`where`/`doc`/`setDoc`/`updateDoc`/`deleteDoc`/
    `getDocs`/`Timestamp`
  - Storage: `ref`/`uploadBytesResumable`/`getDownloadURL`/`deleteObject`
  - Emuladores: `connectFirestoreEmulator`/`connectStorageEmulator`
  - Analytics: `isSupported`/`logEvent`
- Release notes de v13.0.0 (2026-10-07): los breaking changes están **confinados a AI Logic** (no se
  usa) + añadidos de tipos en Firestore. v13.1.0 es un fix de Auth.
- Riesgo restante: **conductual, no de API** (persistencia de sesión de auth, tamaño de bundle,
  comportamiento en runtime).

## Pasos

- [ ] `yarn add firebase@13.1.0` (y actualizar `yarn.lock`).
- [ ] `yarn build` ✅ (< 2 MB) y `yarn test` ✅ 24/135.
- [ ] QA con emuladores (`yarn firebase:emulators:start` + `npm run start:debugMode`):
  - login/logout con `test@mail.com` y recarga de página (persistencia de sesión),
  - CRUD completo de recetas (crear, editar, borrar con diálogo y snackbar),
  - subida y borrado de imagen (Storage),
  - filtro por categorías y búsqueda,
  - analytics no rompe (`isSupported()` puede rechazar en local — comprobar que no pinta errores).
- [ ] Comparar tamaño de bundle antes/después (`Initial total`).
- [ ] Reelaborar el listado de Dependabot tras el bump para ver qué queda.

## Esfuerzo

**M** — el cambio de código es cero; el tiempo está en el QA funcional con emuladores.
```

### I3 — Modernizar `tsconfig.json`

> Issue **#85** creada por el usuario el 2026-10-29: https://github.com/RicardoR/recipes/issues/85

- Scaffold v22 usa `module: "preserve"` + `isolatedModules: true` (sin `moduleResolution`); aquí hay
  `module: "es2020"` + `moduleResolution: "bundler"` + `useDefineForClassFields: false` y falta
  `isolatedModules`.
- **Probado en esta auditoría** (cambio temporal, `ng build` ✅ 5.79s / 1.54 MB y `ng test
  --watch=false` ✅ 24/135, **revertido, árbol limpio verificado**).
- Cuidados: el único hazard de `isolatedModules` es `const enum DatabaseCollectionsNames`
  (`recipe.service.ts:33`) — es same-file, OK; **no** tocar `useDefineForClassFields` sin decisión
  propia (cambia semántica de campos).
- Opcionales en la misma issue: `noImplicitOverride`, `noPropertyAccessFromIndexSignature` del strict
  del scaffold.
- Esfuerzo: **S-M**.

**Texto de la issue (listo para pegar):**

````markdown
## Contexto

El scaffold de Angular 22 (`ng new`) genera hoy:

```json
{
  "compilerOptions": {
    "module": "preserve",
    "isolatedModules": true,
    ...
  }
}
```

(ya **no** declara `moduleResolution`). Este repo se quedó con el formato anterior al upgrade:

```json
{
  "module": "es2020",
  "moduleResolution": "bundler",
  "useDefineForClassFields": false
}
```

Falta `isolatedModules` y sobran/redundan ajustes del scaffold viejo. De #81 se dejó fuera para no
mezclar decisiones de compilación con la PR de dependencias.

## Ya verificado en la auditoría de #81 (no hace falta repetirlo)

- El cambio se aplicó **temporalmente y probado**: `ng build` ✅ (5.79 s / 1.54 MB) y
  `npx ng test --watch=false` ✅ 24 ficheros / 135 tests; después **revertido** (árbol limpio
  verificado con `git status`).

## Cuidados (lecciones de esa prueba)

- **`isolatedModules`**: el único hazard real es
  `const enum DatabaseCollectionsNames` (`recipe.service.ts:33`). Al ser *same-file* (definición y uso
  en el mismo fichero) funciona; el día que se importe en otro módulo, el build fallará → si se
  migra, preferible convertirlo a `enum` normal o `as const`.
- **No tocar `useDefineForClassFields` sin decisión propia**: el scaffold moderno lo deja en su
  default (`true`); cambiarlo altera la semántica de los campos de clase (propiedad own vs. prototipo)
  y puede afectar a patrones de inyección/heritage. Es opcional y se decide aparte.
- `module: "preserve"` implica resolución tipo *bundler*, así que `moduleResolution: "bundler"` pasa a
  ser redundante (el scaffold lo omite).

## Pasos

- [ ] `tsconfig.json`: `module: "preserve"` + `isolatedModules: true`; quitar `moduleResolution`
      (redundante con `preserve`).
- [ ] `yarn build` ✅ (< 2 MB) · `yarn test` ✅ 24/135 · `npm run lint` ✅ 0 errores.
- [ ] Decidir sobre `useDefineForClassFields` (mantener `false` = comportamiento actual, o aceptar el
      default del scaffold con su revisión correspondiente).
- [ ] Opcionales del strict del scaffold: `noImplicitOverride`, `noPropertyAccessFromIndexSignature`.

## Esfuerzo

**S-M** — build/test ya quedaron verificados verdes con el cambio; lo que queda es la decisión sobre
`useDefineForClassFields` y los opcionales.
````

### I4 — Signal inputs en `file-input`

> Issue **#86** creada por el usuario el 2026-10-29: https://github.com/RicardoR/recipes/issues/86

- 5 `@Input()` legacy (`file-input.component.ts:56-60`) mezclados con signal `input()` (62-67). No hay
  `@Output()` en todo `src/` (0 hits).
- Los `ngOnChanges`/`ngDoCheck` (84-90) son el patrón **canónico** de `MatFormFieldControl` +
  `ErrorStateMatcher.isErrorState` → **se quedan**.
- Matices: `ngOnChanges` solo dispara para los inputs legacy; un cambio de un signal input **no** emite
  `stateChanges` hoy.
- No existe esquema automático de signal inputs en las migraciones de core v22 (lista comprobada:
  `can-match-snapshot-required`, `change-detection-eager`, `http-xhr-backend`, `incremental-hydration`,
  `model-output`, `safe-optional-chaining`, `strict-safe-navigation-narrow`, `strict-templates-default`
  — los dos últimos ya aplicados).
- Esfuerzo: **M**.

**Texto de la issue (listo para pegar):**

```markdown
## Contexto

`FileInputComponent` (reemplazo casero de `@ngxmc/file-input` de la issue #73) mezcla hoy dos estilos
de inputs en la misma clase:

- **Legacy** (líneas 56-60): `id`, `placeholder`, `required` (con `transform: booleanAttribute`),
  `disabled` (idem), `value`.
- **Signals** (líneas 62-67): `accept`, `multiple`, `readonly`, `color`, `separator`,
  `errorStateMatcher`.

No existe esquema automático de migración en `ng update` para esto (lista de migraciones de core v22
comprobada en la auditoría de #81: `can-match-snapshot-required`, `change-detection-eager`,
`http-xhr-backend`, `incremental-hydration`, `model-output`, `safe-optional-chaining`,
`strict-safe-navigation-narrow`, `strict-templates-default` — las dos últimas ya aplicadas) → migración
manual. En todo `src/` **no hay ni un solo `@Output()`** (0 hits), así que aquí termina el recorrido
signal-ization de inputs/outputs.

## Hallazgos de la auditoría de #81 (en qué hay que fijarse)

1. **`ngOnChanges`/`ngDoCheck` se quedan**: son el patrón canónico de `MatFormFieldControl` +
   `ErrorStateMatcher.isErrorState` (recalcular estado de error en cada check). Lo que hay que
   reemplazar es el cuerpo de `ngOnChanges` (`stateChanges.next()`), porque **`ngOnChanges` solo
   dispara para inputs legacy**: al convertir a signals deja de emitirse `stateChanges` cuando cambia
   un input… y de hecho **ese hueco ya existe hoy** para los 6 inputs signal actuales (cambiar
   `errorStateMatcher` desde el padre no emite `stateChanges`). Solución: un `effect()` que lea los
   inputs convertidos y emita `stateChanges.next()`.
2. **`value` y `disabled` no son inputs puros**: se escriben *dentro* del componente —
   `writeValue()` (línea 115, CVA), `setDisabledState()` (128, CVA) y `handleFiles()` (153). Un
   `input()` es de solo lectura desde la clase → hay que decidir: `model()` (pero cambia la semántica
   de escritura hacia el padre si hay binding) o separar input de estado interno. **Decisión explícita
   necesaria**, no es un rename.
3. **Contrato `MatFormFieldControl`**: `placeholder`, `required`, `disabled`, `value` (y `id`) son
   propiedades de la interfaz que Material lee desempaquetadas. Si pasan a signal, exponer getters
   planos (`get placeholder() { return this._placeholder(); }`) o Material recibirá una `Signal` donde
   espera un `string`.
4. `id`/`placeholder`/`required` no se escriben internamente → conversión directa (con default:
   `input('Choose a file')`, `input(false, {transform: booleanAttribute})`, …).

## Relación con otras issues

- **#83 (OnPush)**: `file-input.component.ts` está en su Tier 3 y su spec tiene 2 test-hosts; conviene
  hacer ambas cosas en la misma pasada para no tocar el fichero dos veces.

## Criterios de aceptación

- [ ] `grep -r "@Input" src/` → **0 hits** (los 5 legacy migrados a `input()`/`model()`).
- [ ] `stateChanges.next()` se emite cuando cambia cualquier input (añadir test: cambiar
      `errorStateMatcher`/`placeholder` desde el host → `stateChanges` emite).
- [ ] `yarn build` ✅ (< 2 MB) · `yarn test` ✅ 24/135 · `npm run lint` ✅ 0 errores.
- [ ] Smoke: campo deshabilitado desde el form (`setDisabledState`), selección de fichero escribe
      `value`, validación `required` pinta error con el matcher correcto.

## Esfuerzo

**M** — los inputs simples son mecánicos; el tiempo está en `value`/`disabled` (decisión de semántica)
y en el `effect()` de `stateChanges`.
```

### I5 — `Promise` rechazados sin catch nunca llegan a `AppErrorHandler` (bug upstream zone.js)

- **Síntoma**: con `provideBrowserGlobalErrorListeners()` (F6), los errores síncronos de `window`
  `error` llegan a `AppErrorHandler` → snackbar ✅, pero `Promise.reject(...)` sin `.catch` **nunca**
  produce snackbar ni evento de analytics.
- **Causa raíz** (verificado empíricamente en jsdom con zone **0.15.1 y 0.16.3** — ambas afectadas;
  0.16.3 es la última versión publicada):
  1. zone sintetiza un `PromiseRejectionEvent` y llama `eventTask.invoke(evt)` (patch
     `PromiseRejectionEvent` de `zone.umd.js`, líneas ~1963-1971). Pero las event tasks `useG`
     exponen `invoke === ZoneTask.invokeTask(task, target, args)`; el wrapper normal de eventos los
     invoca como `task.invoke(task, target, [event])` (línea ~1076). Pasar el evento como primer
     argumento hace `task = evt` → `evt.zone === undefined` → **`TypeError: Cannot read properties
     of undefined (reading 'runTask')`**.
  2. Ese `TypeError` lo traga el `catch (err) {}` **vacío** de `handleUnhandledRejection` →
     silencio total: el listener de Angular nunca se entera.
  3. **Segundo fallo encima**: con la config por defecto (`throwOriginal` en
     `DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION`), el handler recibe el rechazo *crudo*, así que
     el evento sintético lleva `reason: e.rejection` → `undefined` (las props `.rejection`/
     `.promise` están solo en el error envuelto).
- **Repro A/B** (jsdom + zone cargado, listener registrado):
  - A) `task.invoke(task, window, [{...}])` → ✅ listener invocado, evento entregado.
  - B) `task.invoke({...})` → ❌ `TypeError ... reading 'runTask'` (silenciado por zone).
  - Auto-flujo (`Promise.reject('x')` tras registrar el listener) → `events: []` en 0.15.1 **y**
    0.16.3.
- **Por qué no hay vía alternativa en app**: zone reemplaza `window.Promise` por `ZoneAwarePromise`
  → el evento nativo `unhandledrejection` del navegador **no se dispara**; el puente de zone es el
  único camino hacia Angular. Mitigación solo sería monkey-patchear
  `Zone.__symbol__('unhandledPromiseRejectionHandler')` (API privada, frágil → no recomendado).
- **Impacto**: `AppErrorHandler` (snackbar + `client_error` en analytics) no recibe rejections; zone
  sí las pinta por `console.error`. No bloquea #81: el camino de errores síncronos funciona.
- **Acción**: reportar upstream a `angular/zone.js` con repro mínimo (texto A/B de arriba). Esfuerzo:
  M (depende del fix upstream; workaround en app solo si se decide aceptar frágil).

**Texto de la issue (listo para pegar):**

````markdown
## Síntoma

Durante el smoke test de F6 de #81:

- `setTimeout(() => { throw new Error('boom') })` → **snackbar** ✅ (la vía `window` `error` →
  `AppErrorHandler` funciona; `provideBrowserGlobalErrorListeners()` está activo).
- `Promise.reject('boom promesa')` sin `.catch` → **nada**: ni snackbar ni evento `client_error` en
  analytics. Solo el `console.error` que pinta zone.js en la consola.

## Causa raíz (dos fallos encima, verificado empíricamente)

zone.js es el **único** camino de un `Promise` rechazado hacia Angular: al reemplazar `window.Promise`
por `ZoneAwarePromise`, el evento nativo `unhandledrejection` del navegador **no se dispara nunca**, y
Angular solo escucha ese evento (es lo que registra `provideBrowserGlobalErrorListeners()`). Pues bien,
ese puente de zone está roto:

1. **Firma incorrecta del `invoke`** (zone.umd.js): el puente sintetiza el `PromiseRejectionEvent` y
   llama `eventTask.invoke(evt)` (líneas ~1963-1971). Pero las event tasks optimizadas `useG`
   exponen `invoke === ZoneTask.invokeTask(task, target, args)` — el wrapper normal de eventos los
   invoca como `task.invoke(task, target, [event])` (línea ~1076). Pasar el evento como **primer**
   argumento hace `task = evt` → `evt.zone === undefined` → **`TypeError: Cannot read properties of
   undefined (reading 'runTask')`**.
2. **`catch` vacío**: ese `TypeError` lo traga `handleUnhandledRejection` (`catch (err) {}`) →
   silencio total, el listener de Angular jamás se entera.
3. **Y además**, con la config por defecto (`throwOriginal` de
   `DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION`), el handler recibe el rechazo *crudo*, así que el
   evento sintético llevaría `reason: e.rejection` → `undefined` (`.rejection`/`.promise` existen solo
   en el error envuelto). Arreglar solo (1) no bastaría.

Ambos fallos están en **zone.js 0.15.1 y 0.16.3** (0.16.3 es la última publicada) → no es una
regresión de la subida 0.15→0.16, es un bug latente.

## Repro A/B (jsdom + zone.js cargado)

```js
const {JSDOM} = require('jsdom');
const fs = require('fs');
const dom = new JSDOM('<!doctype html>', {url: 'http://localhost/', runScripts: 'outside-only'});
const w = dom.window;
w.eval(fs.readFileSync('node_modules/zone.js/bundles/zone.umd.js', 'utf8'));
w.eval(`
  window.__events = [];
  window.addEventListener('unhandledrejection', e => window.__events.push(e.reason));
  const task = window.__zone_symbol__unhandledrejectionfalse[0]; // el task de nuestro listener

  // A) firma del wrapper normal de eventos (línea ~1076)
  task.invoke(task, window, [{reason: 'ok'}]);  // ✅ listener invocado, evento entregado

  // B) firma del puente unhandledrejection (línea ~1971)
  task.invoke({reason: 'ok'});                  // ❌ TypeError: ... reading 'runTask'

  Promise.reject('x');                          // auto-flujo: __events queda []
`);
console.log('events:', w.__events); // [] — con 0.15.1 y con 0.16.3
```

## Impacto

`AppErrorHandler` (snackbar + `client_error` en analytics) **no recibe nunca** los `Promise`
rechazados sin catch; solo se ven por el `console.error` de zone. El camino de errores síncronos
funciona, así que #81 no se bloquea.

## Por qué no se puede arreglar en la app

La única mitigación sería monkey-patchear la API privada
`Zone.__symbol__('unhandledPromiseRejectionHandler')` con un puente correcto (`task.invoke(task,
window, [event])` + `reason` fallback al valor crudo). Es una API privada sin garantías de estabilidad
→ no recomendado como solución permanente.

## Acción

- [ ] Reportar upstream a `angular/zone.js` con el repro A/B (en inglés, apuntando a las líneas
      ~1971 vs ~1076 y al `catch` vacío).
- [ ] Decisión de producto: mientras no haya fix upstream, aceptar que los rejections solo aparecen en
      consola (documentarlo), o valorar el workaround monkey-patch.
- [ ] Relacionado con #81 (F6 `provideBrowserGlobalErrorListeners`) — re-testar cuando zone publique
      fix.

## Esfuerzo

**M** — la mayor parte depende del fix upstream; el workaround en app es pequeño pero frágil.
````

### Informativo

- **TypeScript 7 bloqueado upstream**: `@angular/compiler-cli@22.2.3` peer → `typescript: '>=6.0 <6.1'`.
  TS 7.0.2 existe en npm pero no se puede instalar hasta que Angular lo soporte. Sin acción.
- **Migración a tema M3**: no necesaria (M2 prebuilt sigue soportado); si algún día se quiere, es un
  issue puramente visual.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| F1 mal hecha ⇒ CI sigue rojo o no reproducible | Commitear `yarn.lock` + `frozen-lockfile` y abrir la PR para ver el primer run verde antes de nada más |
| F2 (Material 22) rompe algo visual | Las migraciones v22 están vacías y los breaking changes no se usan; smoke test de dialog/menu/select/snackbar |
| Quitar deps usadas indirectamente (F4) | `@angular/platform-browser-dynamic` y `@vitest/browser-playwright` verificados con grep en src/configs/CI y con la ruta de código del builder; validación final con `build` + `test` completos |
| `provideBrowserGlobalErrorListeners` (F6) cambia comportamiento de errores | Es el objetivo: que `AppErrorHandler` reciba los errores globales. Smoke test provocando un error |
| Borrar `src/polyfills.ts` (F5) rompe algo | Verificado: nadie lo referencia (`angular.json` usa `polyfills: ["zone.js"]`) |

---

## 10. Criterios de aceptación global

- `npx ng update` → **sin actualizaciones pendientes** ✅ (core 22.2.4 · cli/build 22.2.5 ·
  material/CDK 22.2.5).
- CI verde en la PR: `cache: 'yarn'` + `yarn install --frozen-lockfile` + `node server.js` + build + test. ✅
- `yarn.lock` **trackeado** y `.gitignore` sin ignorar lockfiles. ✅
- `npx ng build` ✅ (1.57 MB < 2 MB) · `npx ng test --watch=false` ✅ 24/135 · `npm run lint` ✅ 0 errores
  (14 warnings de OnPush aceptados y trazados en I1).
- `package.json` sin `@angular/platform-browser-dynamic` ni `@vitest/browser-playwright`;
  `@vitest/coverage-v8` en devDependencies. ✅
- `AGENTS.md` sin afirmaciones falsas (Angular 22, auth modular, CI yarn, env files correctos). ✅
- Smoke test manual: arranque, login/logout, listado + búsqueda, crear/editar/borrar receta, subida de
  imagen, diálogo de borrado, snackbar, filtro por categorías. ✅ (usuario) — errores globales: error
  síncrono → snackbar ✅; `Promise.rejected` → bug upstream zone.js, trazado en **I5**.

---

## 11. Verificado OK (no requiere acción)

- **Build**: `npx ng build` ✅ (1.54 MB < budget 2 MB).
- **Tests**: `npx ng test --watch=false` → 24 ficheros / 135 tests ✅. El CI no se colgará: el builder
  desactiva watch en non-TTY (`unit-test/options.js:79` → `watch = options.watch ?? isTTY()`), y
  `server.js` genera los 4 env files (incl. el de test) con builtins de Node **antes** de instalar.
- **La eliminación de `provideAnimations()` de `app.config.ts` es segura** (alta confianza):
  `@angular/animations` no está instalado y **0 ficheros** de `node_modules/@angular/material/fesm2022/*.mjs`
  lo referencian; los diálogos de Material 21 usan animaciones **CSS** (`_mat-animation-noopable`,
  `parseCssTime`, `disableAnimations` en `dialog.mjs`). Sin riesgo de crash por synthetic properties.
- **rxjs limpio**: sin `toPromise`, sin operators deprecados, teardowns correctos
  (`takeUntilDestroyed(destroyRef)`; `onAuthStateChanged` con unsubscribe en `auth.service.ts:84-88`).
  No existe rxjs 8 (`latest: 7.8.2`).
- **Sin APIs Material deprecadas en uso**: ni `appearance="legacy"`, ni `MatSnackBar.dismiss()`, ni los
  outputs deprecated de menu (`opened`/`closed` → `menuOpened`/`menuClosed`), ni `MatLegacy*`.
- `ChangeDetectionStrategy.Eager` (14 usos) y su lint `warn` son **conocidos y trazados** (I1).
