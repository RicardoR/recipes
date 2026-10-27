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
| **F1** | **P0**: reproducibilidad — commitear `yarn.lock` + arreglar workflow CI (yarn) | P0 | ❌ | Sin lockfile commitado, `npm ci` y `cache: 'npm'` fallan → la PR tendrá CI rojo. Ver §2 |
| **F2** | **P1**: `@angular/material` + `@angular/cdk` 21.0.6 → 22.2.4 | P1 | ❌ | Único pendiente de `ng update`. Bump puro (migraciones v22 vacías). Ver §3 |
| **F3** | **P1**: actualizar `AGENTS.md` (afirmaciones falsas) | P1 | ❌ | Angular 21→22, `@angular/fire` compat ya inexistente, CI yarn, env files. Ver §4 |
| **F4** | **P1**: limpieza de dependencias sin uso / mal ubicadas | P1 | ❌ | `@angular/platform-browser-dynamic`, `@vitest/browser-playwright`, `@vitest/coverage-v8` a devDeps. Ver §5 |
| **F5** | **P2**: micro-limpieza (archivos muertos, tema duplicado, `packageManager`, parches) | P2 | ❌ | `src/polyfills.ts` huérfano, tema M2 dos veces, `vitest-base.config.ts` → `.mts`, zone.js 0.16.3, etc. Ver §6 |
| **F6** | **P2**: `app.config.ts` — `provideBrowserGlobalErrorListeners()` + quitar `importProvidersFrom(BrowserModule)` | P2 | ❌ | Único punto con valor de comportamiento real (errores globales → `AppErrorHandler`). Ver §7 |
| **F7** | Smoke test final + criterios de aceptación | — | ❌ | `build`/`test`/`lint` verdes + check manual de la app. Ver §10 |
| **(I1)** | Issue: migración de los 14 `ChangeDetectionStrategy.Eager` → OnPush | P2 | 📄 texto entregado | No bloquea la PR (CI no corre lint). Ver §8 |
| **(I2)** | Issue: firebase 11.9.0 → 13.1.0 | P2 | ❌ | Diferible con alta confianza. Ver §8 |
| **(I3)** | Issue: modernizar `tsconfig.json` (`module: "preserve"` + `isolatedModules`) | P3 | ❌ | Probado y verde, revertido. Ver §8 |
| **(I4)** | Issue: terminar migración a signal inputs en `file-input` | P3 | ❌ | 5 `@Input()` legacy. Ver §8 |

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

- Causa confirmada: `@angular/core` 22 `schematics/migrations.json` → `22.0.0 change-detection-eager
  — Adds ChangeDetectionStrategy.Eager to all components`. Afecta a 12 componentes + 2 test-hosts
  (`src/app/shared/components/file-input/file-input.component.spec.ts:25,48`).
- `npm run lint` → `✖ 14 problems (0 errors, 14 warnings)`; regla en `"warn"` (`eslint.config.js:33`).
  **CI no corre lint** ⇒ no bloquea la PR.
- 3 componentes ya son OnPush (toolbar:32, recipe-ribbon:7, recipes-multiple-select:17). El texto de la
  issue ya está redactado (3 tiers: seguros / medios / con trabajo real).
- Esfuerzo: **M** — requiere testing por componente (cambio de comportamiento).

### I2 — firebase 11.9.0 → 13.1.0 (diferible, alta confianza)

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

### I3 — Modernizar `tsconfig.json`

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

### I4 — Signal inputs en `file-input`

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

- `npx ng update` → **sin actualizaciones pendientes** (material/CDK ya en 22.2.4).
- CI verde en la PR: `cache: 'yarn'` + `yarn install --frozen-lockfile` + `node server.js` + build + test.
- `yarn.lock` **trackeado** y `.gitignore` sin ignorar lockfiles.
- `npx ng build` ✅ (< 2 MB) · `npx ng test --watch=false` ✅ 24/135 · `npm run lint` ✅ 0 errores
  (14 warnings de OnPush aceptados y trazados en I1).
- `package.json` sin `@angular/platform-browser-dynamic` ni `@vitest/browser-playwright`;
  `@vitest/coverage-v8` en devDependencies.
- `AGENTS.md` sin afirmaciones falsas (Angular 22, auth modular, CI yarn, env files correctos).
- Smoke test manual: arranque, login/logout, listado + búsqueda, crear/editar/borrar receta, subida de
  imagen, diálogo de borrado, snackbar, filtro por categorías.

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
