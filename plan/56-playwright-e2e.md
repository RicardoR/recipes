# Plan — Issue #56: Tests e2e con Playwright (incremental por componente)

> Objetivo: sustituir los checklists de "smoke manual" que se dejan al final de cada fase
> (`plan/85` F5, `plan/86` F5, `plan/83` F6) por **specs e2e automatizadas** con Playwright,
> corriendo contra los **emuladores de Firebase** locales, añadiendo cobertura componente a
> componente sin romper `build` / `test` / `lint`. Sin comprobaciones a mano al cerrar fases.

Repo: `RicardoR/recipes` · Issue: https://github.com/RicardoR/recipes/issues/56

---

## 0. Progreso de la implementación

Rama: `56-playwright-e2e` (creada desde `master`)

| Fase | Tarea | Estado | Notas |
|---|---|---|---|
| **P0** | Fundación: deps, config, `connectAuthEmulator`, fixtures, primera spec | ✅ | `@playwright/test` 1.64.1 + `firebase-tools` 15.35.0 (devDep, sin `^`) · config `test` en `serve` (H2) · fix de Auth (H1) · `yarn e2e` ✅ 1 spec · lint ✅ 0/0 · unit ✅ 24/139 · build ✅. Ver §4.1 y §0.1 |
| **P1** | Auth y guards | ✅ | `e2e/auth.spec.ts` (6 specs): validación, prefill demo, toggle password, `toolbar-login`, logout y `AuthGuard`. `yarn e2e` ✅ **7 specs** (18/18 con `--repeat-each=3`) · lint ✅ 0/0 · unit ✅ 24/139 · build ✅. **Sin cambios de plantilla**: los 8 `data-testid` de §4.2 ya existían desde P0. Comportamiento de H6 registrado en §0.2 → **D6 decidida: [issue #91](https://github.com/RicardoR/recipes/issues/91)** con el redirect (texto en §0.3) |
| **P2** | Listado público + toolbar | ✅ | `e2e/public-list.spec.ts` (4 specs): render público/privado, filtro por categoría, búsqueda y "Ver" → detalles. `yarn e2e` ✅ **11 specs** (22/22 con `--repeat-each=2`, **33/33 con ×3**) · lint ✅ 0/0 · unit ✅ 24/139 · build ✅. **5 `data-testid` nuevos** + helpers `seedCategory` y `renderAllCards`. Hallazgos H10 (defer fuera de pliegue) y H11 (panel del select). Ver §4.3 y §0.4 |
| **P3** | Detalles + permisos | ✅ | `e2e/recipe-details.spec.ts` (3 specs): pública sin login (+ paneles de ingredientes/pasos), privada ajena → snackbar + redirect (guard) y privada propia logueado → render. `yarn e2e` ✅ **14 specs** (**42/42 con `--repeat-each=3`**) · lint ✅ 0/0 · unit ✅ 24/139 · build ✅. **3 `data-testid` nuevos** (`recipe-details-*`). Ver §4.4 y §0.5 |
| **P4** | CRUD en "Mis recetas" | ✅ | `e2e/my-recipes.spec.ts` (3 specs): crear con validación de requeridos, editar + recarga verifica persistencia, borrar con cancelar/confirmar. `yarn e2e` ✅ **17 specs** (34/34 con `--repeat-each=2`, 15/15 de esta spec ×5) · lint ✅ 0/0 · unit ✅ 24/139 · build ✅. **7 `data-testid` nuevos**. Limpieza resuelta con **D8** (borrado por etiqueta en `afterEach`). Hallazgo H12 (diálogo tras animación). Ver §4.5 y §0.6 |
| **P5** | Flujo de imagen | ✅ | `e2e/image-flow.spec.ts` (3 specs): imagen por defecto + `deleteImage` ignorando `DEFAULT_IMAGE`, subida a Storage que sobrevive a cambios de categoría, y los gates `required`/`imageValidator` de "Subir imagen". `yarn e2e` ✅ **20 specs** (40/40 con `--repeat-each=2`, 15/15 de esta spec ×5) · lint ✅ 0/0 · unit ✅ 24/139 · build ✅. **5 `data-testid` nuevos**. Ficheros `e2e/fixtures/sample.png` + `sample.txt`. Hallazgo **H13** (el `mat-error` necesita `touched`, no `dirty`). `setDisabledState` documentado como N/A en §4.6. Ver §4.6 y §0.7 |
| **P6** | CI y hardening | ⬜ | Job en GitHub, lint de `e2e/`, a11y, anti-flake. Ver §4.7 |

Cada fase cierra con `yarn build` · `yarn test --watch=false` · `npm run lint` · `yarn e2e` en verde.

### 0.1 Estado de P0 y pendientes conocidos (al cerrar la fase)

Hecho y verificado (corrida en frío, sin procesos previos):

- [x] `yarn e2e` arranca emuladores + `ng serve` **solos** y pasa el spec humo (boot → login → logout), con `expectNoConsoleErrors`.
- [x] **3 corridas seguidas sin huérfanos** (los emuladores ya no dejan procesos vivos — H7).
- [x] `npm run lint` ✅ 0 errores / 0 warnings · `yarn test --watch=false` ✅ 24/139 · `yarn build` ✅.
- [x] Helpers verificados contra el emulador: `ensureUser`, `clearFirestore`, `waitForEmulators`, `seedRecipe` (este último sin spec propia todavía: su escenario es P2).

Pendientes / riesgos abiertos para las siguientes fases:

1. **Error transitorio de Firestore en la primera carga** (H9): **investigado el 05/11** — ver §4/§H9.
   Conclusión: es ruido que solo sale en la salida del dev-server, **nunca llega al fixture** (6+
   corridas en frío con el spec en verde) y por tanto **no afecta a `expectNoConsoleErrors`**. El
   mecanismo exacto sigue sin identificar del todo; queda anotado el diagnóstico barato por si
   alguna spec llega a fallar con ese mensaje. No bloquea P1.
2. `seedRecipe` funciona pero **ningún spec lo usa** aún → se consumirá en P2 (habrá que añadir el `data-testid` de `recipe-list`).
3. El CI **no** corre los e2e todavía (decisión D3: hasta P6).
4. Convención de `data-testid`: solo aplicada a `login.component.html` y `toolbar.component.html` (§3.4); el resto va por fases.

### 0.2 Estado de P1 (al cerrar la fase)

Hecho y verificado (corrida completa en frío + `--repeat-each=3`):

- [x] `e2e/auth.spec.ts` — **6 specs**, todos en verde:
  1. *is prefilled with the demo user and signs in on submit*: `test@mail.com` / `123456` en los
     campos, sin `login-error` al cargar, submit → `/recipes/my-recipes` + `toolbar-menu`.
  2. *rejects an empty or invalid email and stays on /login*: `You must enter a value` /
     `Not a valid email` y la URL sigue en `/login` tras pulsar el botón.
  3. *toggles the password visibility*: `type` `password` ⇄ `text` y `aria-pressed` `true` ⇄ `false`
     (ida y vuelta).
  4. *is reached from the toolbar login button*: `toolbar-login` → `/login`.
  5. *logs out from the toolbar menu*: ítem con el texto **`Cerrar sesión`** → `/recipes` +
     `toolbar-login` visible + `toolbar-menu` oculto. (El flujo completo boot→login→logout ya
     lo cubre `smoke.spec.ts`; aquí se añade la aserción de la etiqueta en español.)
  6. *AuthGuard cancels the navigation without redirecting to /login* — ver H6 más abajo.
- [x] `yarn e2e` ✅ **7 specs** (6 de P1 + el humo) · corrida con `--repeat-each=3` → **18/18**.
- [x] `npm run lint` ✅ 0/0 · `yarn test --watch=false` ✅ 24/139 · `yarn build` ✅.
- [x] **0 procesos huérfanos** tras la corrida (H7 sigue vigente).
- [x] **Sin cambios en `src/`**: los testids de §4.2 (`login-*` y `toolbar-menu` /
  `toolbar-logout` / `toolbar-login`) se añadieron en P0, así que no hay riesgo para los specs
  unitarios (la suite completa pasa igual).
- Nota (H9): la línea transitoria de Firestore volvió a aparecer en la salida del dev-server en
  la corrida en frío, **sin llegar al fixture** (specs en verde) — coherente con lo concluido en P0.

**H6 — comportamiento observado del `AuthGuard` sin sesión (D6 decidida → [issue #91](https://github.com/RicardoR/recipes/issues/91), §0.3):**

`page.goto('/recipes/my-recipes')` sin sesión → `AuthGuard.canActivate()` emite `false` y el
router **cancela** la navegación. Observado empíricamente:

| Momento | URL | Contenido |
|---|---|---|
| Resuelve `page.goto` (antes de que el router evalúe el guard) | `/recipes/my-recipes` | aún sin pintar |
| Tras la cancelación (estado asentado) | `/` (el router restaura la URL inicial) | **página en blanco**: ni toolbar ni listas (el único texto del `<body>` es el banner "Running in emulator mode" que inyecta el SDK de Auth) |
| En ningún momento | `/login` | **no hay redirect automático** — el único `navigate` a login es `toolbar.component.ts:81` |

La spec lo fija con `await expect(page).toHaveURL(/\/$/)` (**polling**: la cancelación es
asíncrona respecto a `goto`), más `not.toHaveURL(/login)` y `toHaveCount(0)` para
`toolbar-login`, `app-my-recipes` y `app-public-recipe-list`. Tres corridas seguidas sin flake.

✅ **D6 — decidido con el usuario (08/11): issue aparte → https://github.com/RicardoR/recipes/issues/91**
para el redirect a `/login`; el comportamiento actual queda **cubierto y documentado tal cual**
por la spec (sin cambios de código en esta fase). El texto con el que se abrió queda en §0.3.

### 0.3 D6 — issue de follow-up: [#91](https://github.com/RicardoR/recipes/issues/91)

> **Abierto el 08/11** (sin `gh` local → pegado manualmente en GitHub). Texto con el que se
> creó, por si hace falta reabrirlo o comentarlo:

**Título:**

```
AuthGuard cancela la navegación sin sesión y deja una pantalla en blanco (sin redirect a /login)
```

**Cuerpo:**

```markdown
Descubierto al implementar P1 de #56 (specs e2e de auth/guards).

## Pasos para reproducir

1. Abrir la app **sin sesión** en una ruta protegida, p.ej. `/recipes/my-recipes`
   (igual con `/recipes/new` o `/recipes/edit/:id`).
2. Observar: la URL acaba en `/` y se pinta una **página en blanco** — sin toolbar y sin
   listas (el único texto del `<body>` es el banner "Running in emulator mode" que inyecta el
   SDK de Auth).
3. Recargar el navegador → ahora sí se muestra la lista pública (la ruta `**` redirige a
   `recipes`).

## Comportamiento esperado

Redirigir a `/login` (idealmente conservando la ruta original, p.ej. con un query param
`returnUrl`, para volver tras autenticarse) en lugar de dejar una pantalla en blanco.

## Causa

`AuthGuard` (`src/app/core/auth/guards/auth.guard.ts`) devuelve `initAuthListener()`: sin
sesión el ReplaySubject emite `false` y el router **cancela** la navegación. No hay ningún
`navigate` a `/login` en el guard — el único de la app está en
`toolbar.component.ts:81` (`goToLogin`).

## Notas

- Comportamiento actual cubierto por la spec `e2e/auth.spec.ts` →
  `AuthGuard › cancels the navigation without redirecting to /login`
  (aserciones: URL asentada en `/`, nunca `/login`, outlet vacío). **Hay que actualizarla**
  cuando se implemente el redirect.
- Contexto completo: `plan/56-playwright-e2e.md` §0.2 (H6/D6).
```

### 0.4 Estado de P2 (al cerrar la fase)

Hecho y verificado:

- [x] `e2e/public-list.spec.ts` — **4 specs**, todos en verde:
  1. *renders the seeded public recipes and hides private ones*: 2 públicas pintadas + una
     privada de otro dueño que **no** aparece (cubre el `@defer` + OnPush de #83, vía
     `renderAllCards` — H10).
  2. *reduces the list when a category is selected*: seleccionar `Verduras <uid>` deja 1 tarjeta
     y oculta la otra; deseleccionar las devuelve las dos.
  3. *searches from the toolbar and restores the list when cleared*: buscar `<uid>` reduce a 1,
     limpiar restaura las 2.
  4. *opens the details page with the "Ver" button*: URL `/recipes/details/:id` + `app-recipe-details`
     con el título.
- [x] `yarn e2e` ✅ **11 specs** → **22/22** con `--repeat-each=2` y **33/33 con ×3** ·
  `npm run lint` ✅ 0/0 · `yarn test --watch=false` ✅ 24/139 · `yarn build` ✅ · **0 huérfanos**.
- [x] **5 `data-testid` nuevos**: `recipe-list`, `recipe-card`, `recipe-card-title`,
  `recipe-view` (en `recipe-list.component.html`) y `category-filter` (en
  `recipes-multiple-select.component.html`, el control compartido — inventario actualizado en §3.4).
  Specs unitarios ✅: los tres que renderizan esa plantilla usan `.overrideTemplate(...)`.
- [x] Helpers: nuevo `seedCategory()`; `seedRecipe()` **ahora escribe también el campo `id`**
  (=`id` del documento): lo exigen `getRecipeDetail` y `PrivateRecipeGuard`, que consultan
  `where('id', '==', id)` — sin él, "Ver" navegaba y el guard devolvía error (§3.5).
- [x] `renderAllCards()` en `e2e/fixtures.ts` (H10) y fix del flake del panel del select (H11).
- Con esto quedan resueltos los pendientes 2 (`seedRecipe` sin spec) y 4 (inventario de
  `data-testid`) que §0.1 dejó al cerrar P0.

Pendientes / riesgos abiertos para las siguientes fases:

1. **P4 necesitará limpiar la BD** (`clearFirestore()` en `beforeEach`) mientras otras specs
   corren en paralelo contra el mismo emulador → decidir la estrategia en P4 (serializar solo
   las specs que escriben, o limpiar únicamente los documentos propios). Ver **D7**;
   **resuelta en D8** (borrado por etiqueta en `afterEach`).
2. **`npx playwright …` se colgó una vez en local** (cuelgue del entorno: cero salida, cero
   procesos, no de los tests). Lanzar los e2e con **`yarn e2e`** o
   `node node_modules/@playwright/test/cli.js test`, que es lo que hace el propio script.
3. El CI **no** corre los e2e todavía (D3: hasta P6).

### 0.5 Estado de P3 (al cerrar la fase)

Hecho y verificado:

- [x] `e2e/recipe-details.spec.ts` — **3 specs**, todos en verde:
  1. *a public recipe is readable without logging in*: sin sesión, título + expansión de
     `recipe-details-ingredients` y `recipe-details-steps` con los valores sembrados.
  2. *a foreign private recipe shows the snackbar and redirects to the list*: privada con
     `ownerId: 'someone-else'` → URL `/recipes`, snackbar *"No estás autorizado para ver esta
     receta"* y sin `recipe-details-title` (guard, `private-recipe.guard.ts:27-35`).
  3. *an own private recipe renders for its signed-in owner*: uid del dueño con
     `ensureUser(E2E_USER…)` + `signIn(page)` → la receta privada propia sí pinta.
- [x] `yarn e2e` ✅ **14 specs** → **42/42** con `--repeat-each=3` · `npm run lint` ✅ 0/0 ·
  `yarn test --watch=false` ✅ 24/139 · `yarn build` ✅ · **0 huérfanos**.
- [x] **3 `data-testid` nuevos** en `recipe-details.component.html` (`recipe-details-title`,
  `recipe-details-steps`, `recipe-details-ingredients`) → inventario total **22** (§3.4/§6).
  Specs unitarios ✅: `recipe-details` se renderiza en specs con plantilla real sin aserciones
  que se rompan (los testids son atributos pasivos).
- Sin hallazgos nuevos (H10/H11 siguen documentados en §1; el cuelgue de `npx`/`yarn` se repitió
  una vez más y otra vez se resolvió invocando el binario directamente → pendiente 2 de §0.4).

Pendiente heredado sin cambios: **D7** — P4 aún debe decidir la estrategia de limpieza en
paralelo (§0.4.1) → **resuelta en D8** (arriba, §2).

### 0.6 Estado de P4 (al cerrar la fase)

Hecho y verificado:

- [x] `e2e/my-recipes.spec.ts` — **3 specs**, todos en verde:
  1. *creates a recipe from the form, with required-field validation*: botón deshabilitado
     con el formulario vacío (y con un ingrediente recién añadido vacío), habilitado al
     completar título/descripción/ingrediente → crear → URL `/recipes/my-recipes` + tarjeta
     visible en la lista.
  2. *edits a recipe and the change persists after a reload*: receta sembrada con el uid de
     `e2e@example.com` → `/recipes/edit/:id` → cambiar título → snackbar *"Receta actualizada"*
     → **`page.reload()`** → el form vuelve con el título nuevo (lectura de Firestore) → y la
     página de detalles lo muestra también.
  3. *deletes a recipe from the confirmation dialog*: `recipe-delete` → `dialog-cancel` → la
     receta sigue (tras esperar a que el diálogo se destruya, **H12**) → `recipe-delete` →
     `dialog-confirm` → la tarjeta desaparece (`toHaveCount(0)`).
- [x] `yarn e2e` ✅ **17 specs** → **34/34** con `--repeat-each=2` · esta spec **15/15** con
  `--repeat-each=5` · `npm run lint` ✅ 0/0 · `yarn test --watch=false` ✅ 24/139 ·
  `yarn build` ✅ · **0 huérfanos**.
- [x] **7 `data-testid` nuevos** (§4.5) → inventario total **29** (§3.4/§6). Specs unitarios ✅:
  los que renderizan esas plantillas (`recipe-card-form`, `delete-recipe-dialog`, `recipe-list`)
  usan `.overrideTemplate(...)`.
- [x] **D8 aplicada**: `uniqueId()` compartido (antes duplicado en `public-list.spec.ts`,
  ahora importado de `e2e/support/data.ts`) + `deleteRecipesWithTitle(tag)` en el `afterEach`
  de las specs de escritura; `clearFirestore()` sigue solo en `globalSetup`.
- [x] Hallazgo **H12** (diálogo que reabre durante la animación de cierre) — misma familia
  que H11; ver §1.

Notas de entorno (no son de los tests):

- La carga de la máquina local (load > 100 en un pico, apps de escritorio + `ng serve`)
  retrasó/superó timeouts en varios runs: tras calmar el sistema, todo pasa limpio. Los
  cuelgues de `npx playwright …`/`yarn e2e` (cero salida) se repitieron; sigue en pie el
  pendiente 2 de §0.4 (invocar el binario directamente).

---

### 0.7 Estado de P5 (al cerrar la fase)

Hecho y verificado:

- [x] `e2e/image-flow.spec.ts` — **3 specs**, todos en verde:
  1. *a recipe without an uploaded picture shows the default image and deletes cleanly*:
     receta sembrada con `imgSrc: ''` → converter → `img.recipe-details__image` con
     `src=/verduras\.jpeg/` → **Borrar** → `dialog-confirm` → vuelve a `/recipes` y
     `deleteImage` **no** toca `DEFAULT_IMAGE` (`recipe.service.ts:267`), sin errores de consola.
  2. *uploads a picture to the emulator and keeps it through category changes*: en
     `/recipes/new` → seleccionar `sample.png` → `file-input-display` con el nombre +
     `picture-preview` visible + `picture-upload` habilitado → cambiar de categoría (con H11:
     deseleccionar en el panel abierto, `Escape`, esperar `toBeHidden`) y el campo **no se
     pierde** → `picture-upload` → esperar a que `mat-progress-bar` esté oculto (subida al
     emulador de Storage) → rellenar título/descripción → `form-submit` → `/recipes/my-recipes`
     → `renderAllCards` (H10) → detalles → `src` con `:9199` (URL del emulador, no el asset).
  3. *gates "Subir imagen" on the required field and the image validator*: sin foto ⇒
     `picture-upload` deshabilitado y sin error → fichero no-imagen ⇒ **`Formato de archivo
     incorrecto`** visible + botón deshabilitado + `file-input-display` = `sample.txt` →
     imagen válida ⇒ error fuera + botón habilitado.
- [x] `yarn e2e` ✅ **20 specs** → **40/40** con `--repeat-each=2` · esta spec **15/15** con
  `--repeat-each=5` · `npm run lint` ✅ 0/0 · `yarn test --watch=false` ✅ 24/139 ·
  `yarn build` ✅ · **0 huérfanos**.
- [x] **5 `data-testid` nuevos** (§4.6) → inventario total **34** (§3.4/§6): los tres de
  `file-input.component.html` (`file-input-display`, `file-input-browse`, `file-input-native`)
  y `picture-preview`/`picture-upload` en `recipe-card-form.component.html`. Specs unitarios ✅:
  los que renderizan esas plantillas usan `.overrideTemplate(...)`.
- [x] Ficheros de prueba: `e2e/fixtures/sample.png` (PNG de 1×1) + `e2e/fixtures/sample.txt`.
- [x] **Limpieza**: la única escritura es la subida a **Storage**, con nombre con timestamp único
  → no queda nada en Firestore que limpiar; no hace falta `afterEach` (los objetos de Storage
  sin limpiar quedan anotados como pendiente de P6).
- [x] **`setDisabledState` → N/A**: `grep` en `src/` no hay ninguna ruta de UI que deshabilite
  el control `photo` (nada hace `disable()` sobre ese `formControl`), así que no se puede
  ejercitar desde un e2e. Queda cubierto por el unitario
  `file-input.component.spec.ts` (`setDisabledState` marca `disabled` y avisa a `stateChanges`).
  Documentado en §4.6.
- [x] Hallazgo **H13** (el `<mat-error>` exige `touched`, no `dirty`) — ver §1: fue el motivo
  real del único fallo de la fase.

Notas de entorno (no son de los tests):

- Se reintentó la teoría del "build en vuelo" (Vite sirve la plantilla editada) y **no era esa
  la causa**: el fallo era de estado del control (H13). Todo el instrumentación de depuración
  (`e2e/_probe.spec.ts`, `console.log` en plantillas) se retiró antes de cerrar; `git diff src/`
  solo contiene los 5 `data-testid`.

---

## 1. Contexto — hallazgos verificados en el repo

Investigación hecha antes de escribir este plan (todo con `grep`/lectura en `master`):

### H1 — No existe ningún `connectAuthEmulator` en `src/` (gap bloqueante)

- `recipe.service.ts:57-61` conecta **solo** Firestore (`localhost:8080`) y Storage
  (`localhost:9199`) bajo `environment.useEmulators`.
- `grep -rn "connectAuthEmulator" src/` → **0 hits**.
- El modo `useEmulators: true` solo lo consume el build de unit tests
  (`recipes:build:test` → `environment.test.ts`, `angular.json:103-110`); **ese build nunca
  arranca la app en un navegador**, solo corre specs de Vitest con mocks.
  → **Nadie ha probado nunca el login en emulador.** Sin este fix, ningún e2e de auth funciona:
  `signInWithEmailAndPassword` iría a Identity Toolkit con `apiKey: 'fake-api-key'`.

### H2 — No hay configuración `serve` para el build `test`

- `recipes:build:test` existe (con `fileReplacements` → `environment.test.ts`), pero `serve`
  solo expone `production` / `development` / `debugMode` (`angular.json:114-128`).
- Falta añadir `"test": {"buildTarget": "recipes:build:test"}` para poder servir la app en
  modo emulador desde Playwright.

### H3 — Todo lo demás ya está preparado

| Pieza | Estado |
|---|---|
| Emuladores en `firebase.json` | ✅ auth **9099**, firestore **8080**, storage **9199**, UI **4000** |
| Java (necesario p/ Firestore+Storage emulator) | ✅ `Java 25.0.2` local; `ubuntu-latest` lo trae |
| `firebase` CLI | ⚠️ global `14.5.1` — ver **D2** |
| `environment.test.ts` | ✅ `demo-recipes` + claves fake + `useEmulators: true` (lo escribe `server.js`) |
| Service worker en e2e | ✅ desactivado (`ServiceWorkerModule` solo con `production: true`, `app.config.ts:36`) |
| Selectores | ✅ `aria-label` (toolbar, toggle password), `mat-label` (login, formulario) y textos visibles en español — ver **D4** |
| Setup e2e previo | ❌ no existe (`ng e2e` no configurado, sin carpeta `e2e/`) — tal como indica `AGENTS.md` |

### H4 — El usuario demo bloquea el CRUD (condiciona el seeding)

`auth.service.ts:33` (`FAKE_USER_EMAIL = 'test@mail.com'`): con ese usuario,
`createRecipe` / `updateRecipe` / `deleteRecipe` / `uploadFileAndGetMetadata` / `deleteImage`
**lanzan excepción síncrona** (`recipe.service.ts:139,168,213,232,263`).
→ Hacen falta **dos** usuarios sembrados: `test@mail.com` (prefill del form, para specs de
demo/limitaciones) y un usuario normal p.ej. `e2e@example.com` (para CRUD real).

### H5 — `getAnalytics()` se crea incondicionalmente con `measurementId` fake

`firebase.providers.ts` llama `getAnalytics()` con `G-0000000000` y `apiKey: 'fake-api-key'` →
en navegador real intentará contactar con Google y pintará errores de red en consola.
→ Se bloquea desde el test (`page.route`), **sin tocar código** (ver §3.3).

### H6 — No hay redirect a `/login` automático

`AuthGuard` (`auth.guard.ts`) devuelve `initAuthListener()`: sin sesión emite `false` y la
navegación se **cancela**, pero **no** redirige a `/login` (el único `navigate` a login es
`toolbar.component.ts:81`). → La spec de P1 debe verificar y documentar el comportamiento
observado, no asumir un redirect.

### H7 — Los emuladores dejan procesos huérfanos (detectado en P0)

Al parar los emuladores, `firebase-tools` sale **sin** llevarse al JVM de Firestore: queda un
`java` escuchando en `8080` (y antes también en `9000`, porque `firebase.json` arranca el emulador
de *database* aunque no lo usemos) y la siguiente corrida falla con `port taken`.
**Solución aplicada en P0:**

- `e2e/support/start-emulators.mjs` (script `yarn emulators`): libera los puertos `9099/8080/9199`
  **antes** de arrancar y **cuando** `firebase` termina.
- `playwright.config.ts`: `gracefulShutdown: { signal: 'SIGTERM', timeout: 15_000 }` → Playwright
  señala al **grupo de procesos** en vez de matar en frío, con lo que el wrapper limpia al salir.
- `--only auth,firestore,storage,ui`: evita database (puerto 9000, ocupado en esta máquina) y
  hosting (5000, ocupado por macOS ControlCenter), que hacían fallar el arranque.

Verificado: **3 corridas seguidas con 0 procesos huérfanos**. Los emuladores tardan ~14 s en estar
todos listos; **el Emulator UI (4000) es la última pieza en subir**, por eso el `port: 9099` como
readiness + la espera real en `globalSetup`.

### H8 — La REST de Firestore no tiene `clear` ni "create"

Verificado con `curl` contra el emulador en P0:

- `POST /emulator/v1/.../documents/clear` → **404** (no existe ese endpoint aquí).
- `POST /v1/.../documents` → **404**; el alta es `PATCH /v1/.../documents/{col}/{id}?documentId=…`.
- Listado válido: `GET /v1/.../documents/{col}` con `Authorization: Bearer owner`.

→ `clearFirestore()` lista y borra (`recipes`, `categories`) y `seedRecipe()` usa `PATCH`; ambos
probados contra el emulador. Sin sub-colecciones (la app no usa).

### H9 — Error transitorio de Firestore en la primera carga (investigado 05/11, sin impacto)

En las corridas en frío, el dev-server registra
`@firebase/firestore: Could not reach Cloud Firestore backend. Connection failed 1 times`; el SDK
reintenta y la app carga igual. **No lo captura el fixture de consola** (aserción en verde con el
error en la salida del dev-server).

**Experimentos realizados (05/11):**

| # | Experimento | Resultado |
|---|---|---|
| 1 | Forzar el fallo real de Firestore en la página bajo test (`page.route` → abortar el puerto `8080`) | **El fixture sí lo captura** (2 entradas) → Playwright no tiene puntos ciegos para nuestra página |
| 2 | Reproducción en frío ×6+ con el spec completo | La línea aparece **siempre**; **el spec pasa siempre** (nunca la captura) |
| 3 | Listener crudo de CDP (`Runtime.consoleAPICalled`) + `page.on('console')` en la misma corrida | El error **no aparece en ninguno de los dos**, pero sí en la salida del dev-server |
| 4 | Parche de `console.*` dentro de la propia página que hace streaming a Node (`exposeFunction`, cubre todas las navegaciones) | **Tampoco** aparece |
| 5 | Enumeración de targets (`Target.getTargets`, `targetCreated/Destroyed`, auto-attach) y muestreo de procesos | **Un solo navegador y una sola página** durante toda la corrida |
| 6 | Spec que no carga la app (`about:blank`) | La línea **no aparece** → hace falta que la app cargue |
| 7 | Interceptar/bloquear el websocket HMR de la página (`routeWebSocket`) | La línea desaparece, **pero** con espía activo tampoco se reproduce nunca → el experimento altera tiempos y no sirve como prueba |

**Lo que se sabe:** la línea la emite un cliente del entorno `client` de vite a través del evento
`vite:forward-console` (prefijo `[vite] (client)`), es decir una página con `@vite/client`; y no es
la página bajo test (experimentos 3 y 4). **Lo que no se identificó:** qué otro cliente es, dado
que solo hay un navegador (experimento 5). Hipótesis más probable: **carrera entre la primera
conexión de Firestore y la disponibilidad del canal WebChannel del emulador** — `globalSetup` solo
espera una consulta REST, que puede estar lista antes que el canal de Listen.

**Conclusión práctica:** es ruido exclusivo de la salida del dev-server; **no afecta a la aserción
`expectNoConsoleErrors`** (6+ corridas en frío en verde). Se mantiene la aserción estricta. **Si
alguna spec falla algún día con este mensaje**, el diagnóstico barato es parchear
`vite:forward-console` en `node_modules/vite/dist/node/chunks/node.js` para loguear los puertos de
los sockets conectados y correlacionarlos con `lsof -iTCP:4200` (obtener el PID del emisor);
revertir el parche después (hay copia de seguridad del fichero).

### H10 — `@defer (on viewport)` deja en placeholder las tarjetas fuera del pliegue (detectado en P2)

`recipe-list.component.html` renderiza cada tarjeta dentro de `@defer (on viewport)`. Las
tarjetas que quedan **por debajo del pliegue** siguen siendo el placeholder (esqueleto) hasta que
entran en el viewport, y el placeholder **no lleva** `data-testid="recipe-card"` → un `toBeVisible`
sobre una tarjeta de abajo falla con *"element(s) not found"* aunque el documento exista en
Firestore. Verificado con un spec sonda: 8 recetas → `cards=6 skeletons=2`, y tras recorrer la
página → `cards=8 skeletons=0`.

**Mitigación:** `renderAllCards(page)` en `e2e/fixtures.ts` — espera a que lleguen los datos,
recorre la página por pasos de media ventana (dos `requestAnimationFrame` por paso para que el
`IntersectionObserver` dispare) y vuelve arriba, esperando a que no queden `.placeholder-skeleton`.
Toda spec que aserca de tarjetas la llama tras cada cambio que **crece** la lista.

### H11 — Reabrir el `mat-select` con la animación de cierre en marcha pierde el click (flake en P2)

Al deseleccionar una categoría el patrón *click opción → `Escape` → click en `category-filter` →
click opción* fallaba de forma intermitente (1 de 8 corridas): el segundo click en el `mat-select`
se ejecutaba mientras el panel aún se estaba cerrando y **no abría** (o reabría) el panel, con lo
que el locator de la opción nunca resolvía o se desenganchaba en bucle hasta el timeout del test.

**Mitigación aplicada:** el `mat-select` **multiple** mantiene el panel abierto tras seleccionar,
así que la deselección se hace **en el mismo panel** (sin reabrir) y después `Escape` +
`await expect(option).toBeHidden()` como **punto de sincronía** de que el panel está del todo
destruido antes de tocar la página. Sin este cambio: 1/8 fallos; con él: 22/22 y 33/33 en verde.

### H12 — Reabrir el diálogo de borrado durante su animación de cierre superpone dos diálogos (flake en P4)

En `my-recipes.spec.ts` (*deletes a recipe…*): tras `dialog-cancel` se volvía a pulsar
`recipe-delete` de inmediato, y el `DeleteRecipeDialogComponent` anterior aún estaba saliendo →
**dos** `data-testid="dialog-confirm"` en el DOM a la vez y fallo de *strict mode* en el segundo
click. Misma familia que H11: el problema no es el locator, es **reabrir antes de que la
animación de cierre termine**.

**Mitigación:** `await expect(page.getByTestId('dialog-confirm')).toHaveCount(0)` tras cancelar,
como punto de sincronía de que el diálogo quedó destruido (y solo después se reabre). Verificado:
la spec pasó **15/15** con `--repeat-each=5` después del fix.

### H13 — El `<mat-error>` de `mat-form-field` solo se proyecta con `errorState = true`, que exige `touched` (no `dirty`) (P5)

Detectado en `image-flow.spec.ts` (gates de "Subir imagen"): `setInputFiles()` sobre
`file-input-native` dejaba el control `INVALID` (el `<input>` mostraba `IF=true ST=INVALID`)
pero **el texto `Formato de archivo incorrecto` no aparecía** y el spec fallaba. Causa, leída en
el código de Angular Material:

- `mat-form-field` solo inserta los hijos `<mat-error>` en el DOM cuando
  `_getSubscriptMessageType() === 'error'`, y eso exige `_control.errorState === true`
  (`@angular/material/fesm2022/_form-field-chunk.mjs:938`); con `false` el tipo es `'hint'` y
  los errores **no se renderizan** (no es un problema de timing ni de build en vuelo).
- `FileInputComponent.errorState` usa el `ErrorStateMatcher` **por defecto**:
  `invalid && (touched || form.submitted)` — **no mira `dirty`**
  (`@angular/material/fesm2022/_error-options-chunk.mjs:45`).
- Escribir directamente en el input nativo (`setInputFiles()`) dispara el *view change pipeline*
  (`_pendingDirty` → `dirty`), pero **no** el *blur pipeline* → el control queda **`dirty` pero
  `untouched`** → `errorState = false` → `mat-error` fuera del DOM.
- El `touched` lo pone la ruta real del usuario: `openFilePicker()` llama a `markAsTouched()`
  (`file-input.component.ts:145`) al pulsar el botón Examinar.

**Mitigación (en el spec, no en la app):** seleccionar el fichero por la ruta del usuario —
`page.waitForEvent('filechooser')` + click en `file-input-browse` → `chooser.setFiles(...)` —
con el helper `selectFile(page, file)` de `image-flow.spec.ts`. Así el control queda `touched`
y el `mat-error` se proyecta. Es además más realista y ejercita `file-input-browse`.

**Implicación para futuras specs:** cualquier assert de un `mat-error` de este formulario pasa
por **pulsar el botón Examinar** (o hacer `blur()`/`markAsTouched()` vía UI); nunca por
escribir directamente en `file-input-native`. Correr con `setInputFiles()` solo sigue valiendo
para asserts que **no** dependan del error (p.ej. el preview y el nombre en el spec 2).

Verificado: la spec **15/15** con `--repeat-each=5` y la suite completa **40/40** con
`--repeat-each=2` después del cambio.

---

## 2. Decisiones registradas (con el usuario)

| # | Decisión | Resultado |
|---|---|---|
| **D1** | Entorno de los tests | **Emuladores locales** (hermético, sin credenciales, sin datos reales, corre en CI/offline). Implica el fix de H1. |
| **D2** | CLI de emuladores | **`firebase-tools` como devDependency** → reproducible en cualquier clon y en CI, versión fijada en `yarn.lock` (hoy es un binario global). |
| **D3** | Momento de activar CI | **En la fase P6**; hasta entonces `yarn e2e` corre solo en local, para no pelear con flakiness mientras se construyen las specs. |
| **D4** | Estrategia de selectores | **`data-testid` en todas** las plantillas implicadas (más estable ante cambios de texto que depender de labels visibles). Convención en §3.4. |
| **D5** | Ruido de analytics en consola (revisada en P0) | Primero se probó **solo bloquear la red** (§3.3 original) y **no bastó**: el SDK igualmente hace `console.error` (`Installations: …`). Aplicado además un guard en `AnalyticsService`: con `environment.useEmulators` no se inicializa analytics (la app ya degrada a `console.warn`, igual que cuando `isSupported()` es falso). Los hosts de Google se siguen bloqueando por si acaso. **Resultado: `expectNoConsoleErrors` estricto, sin allowlist.** |
| **D7** | Datos entre specs en paralelo (P2) | Los specs corren en **paralelo contra un único emulador**, así que **no se limpia la BD entre specs**: cada test siembra con un **`uid` único por invocación** y solo aserca de **sus propios documentos** (nunca de totales de lista). `clearFirestore()` sigue en `globalSetup` (arranque de suite). ⚠️ Las specs de P4 que escriban **sí** necesitarán limpieza → resuelta en **D8**. |
| **D8** | Limpieza de las specs que escriben (P4) | En lugar del `clearFirestore()` en `beforeEach` que planteaba §4.5 (borraría los datos de las specs que corren en paralelo — el problema que D7 dejó abierto): cada spec de escritura **etiqueta sus documentos con `uniqueId()`** (en el título) y en su **`afterEach` borra solo los suyos** con `deleteRecipesWithTitle(tag)` (`e2e/support/data.ts`). La BD global solo se limpia en `globalSetup`, al arrancar la suite. Los specs de lectura (P1-P3) no se ven afectados: solo asercan de documentos con su propio `uid`. |

**Herramienta: Playwright** (`@playwright/test`). Descartados: Cypress (un solo tab, subida de
ficheros/iframes más incómodos, sin bloqueo de red por test), WebdriverIO/Selenium (setup
innecesario sin dispositivos reales), Protractor (eliminado desde Angular 20). Vitest browser
mode queda como complemento futuro, no sustituto (no cubre router/guards/Firebase).

---

## 3. Arquitectura de la solución

### 3.1 `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:4200',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'yarn emulators',
      url: 'http://localhost:4000',        // Emulator UI → readiness check fiable
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'yarn start:e2e',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
```

### 3.2 Scripts nuevos (`package.json`)

```json
"start:e2e": "ng serve --configuration=test",
"emulators": "node e2e/support/start-emulators.mjs",
"emulators:raw": "firebase emulators:start --project demo-recipes --only auth,firestore,storage,ui",
"e2e": "playwright test",
"e2e:ui": "playwright test --ui"
```

`emulators` envuelve al CLI con la limpieza de puertos de H7; `emulators:raw` deja el comando
literal a mano. `start:e2e` depende de la configuración `test` añadida en `serve` (H2):
`"test": { "buildTarget": "recipes:build:test" }`.

### 3.3 Bloqueo de red de analytics (fixture) — D5

```ts
// e2e/fixtures.ts
const BLOCKED_GOOGLE_HOST =
  /googletagmanager\.com|google-analytics\.com|firebaseinstallations\.googleapis\.com|firebase\.googleapis\.com/;

await page.route((url) => BLOCKED_GOOGLE_HOST.test(url.hostname), (route) => route.abort());
```

Los errores de consola cuya URL de origen esté en esa lista se descartan del array
`consoleErrors`. **Redacción complementaria (D5)**: `AnalyticsService` no inicializa analytics
cuando `environment.useEmulators`, así que no se dispara ninguna de esas peticiones y la aserción
`expectNoConsoleErrors` puede ser estricta (lista vacía), sin allowlist de textos.

### 3.4 Convención de `data-testid` (D4)

Prefijo por ficha, kebab-case, en inglés (el código es inglés; la UI es español):

| Fichero | Ejemplos |
|---|---|
| `login.component.html` | `login-email`, `login-password`, `login-submit`, `login-toggle-password`, `login-error` |
| `toolbar.component.html` | `toolbar-menu`, `toolbar-logout`, `toolbar-create`, `toolbar-my-recipes`, `toolbar-all-recipes`, `toolbar-search`, `toolbar-search-toggle`, `toolbar-login`, `toolbar-list-icon` |
| `recipe-list.component.html` | `recipe-list`, `recipe-card`, `recipe-card-title`, `recipe-card-description`, `recipe-view`, `recipe-delete` |
| `recipes-multiple-select.component.html` | `category-filter` (el `mat-select` compartido: filtro de la lista y selector de categorías del formulario) |
| `recipe-card-form.component.html` | `recipe-form`, `form-title`, `form-description`, `form-submit`, `picture-upload`, `picture-preview`, `form-error-*` |
| `file-input.component.html` | `file-input-display`, `file-input-browse`, `file-input-native` |
| `delete-recipe-dialog.component.html` | `dialog-confirm`, `dialog-cancel` |
| `recipe-details.component.html` | `recipe-details-title`, `recipe-details-steps`, … |

Reglas: **idéntico** entre specs y plantillas; añadido junto al elemento existente (no sustituye
clases/roles); `grep data-testid src/` debe cuadrar con el inventario de este plan.

### 3.5 Sembrado y limpieza de datos (globalSetup + fixtures)

**Usuarios** — REST del Auth emulator (funciona con cualquier `key`):

```
POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=any
{"email":"e2e@example.com","password":"123456","returnSecureToken":true}
POST .../accounts:signInWithPassword?key=any   // para reutilizar entre corridas
```

Sembrados: `e2e@example.com` / `123456` (CRUD) y `test@mail.com` / `123456` (demo, H4).

**Recetas** — REST del Firestore emulator (documento plano, debe casar con
`recipesConverter` de `recipe.service.ts:298`: `date` Timestamp, `title`, `description`,
`ownerId`, `steps`, `ingredients`, `imgSrc`, `private`, `categories` — y **`id`**, el mismo que
el `id` del documento, porque `getRecipeDetail`/`PrivateRecipeGuard` hacen
`where('id', '==', id)`, igual que `createRecipe`):

```
POST http://localhost:8080/v1/projects/demo-recipes/databases/(default)/documents/recipes
Authorization: Bearer owner
```

**Limpieza entre specs** — el emulador **no** tiene endpoint `clear` (H8), así que
`clearFirestore()` lista `recipes` + `categories` y borra documento a documento
(`Authorization: Bearer owner`). Se ejecuta en el `globalSetup` para partir de una BD vacía. Las
specs de P4 que escriban **no** lo repiten en `beforeEach` (borraría los datos de las specs en
paralelo) → usan `deleteRecipesWithTitle(tag)` en su `afterEach`, según **D8**.

**`categories`** — la colección `categories` lleva documentos `{id, detail}` (lo que lee
`elementModelConverter`); el helper `seedCategory(id, detail)` los crea con `PATCH`. El `id` se
escribe como **string**, igual que en `seedRecipe`, porque `RecipeListComponent` compara las
categorías seleccionadas con las de la receta mediante `===`.

Helper central: `e2e/support/data.ts` con `ensureUser()`, `seedRecipe()`, `seedCategory()`,
`clearFirestore()`, `waitForEmulators()`, `uniqueId()` y `deleteRecipesWithTitle()` — los specs
nunca hablan REST directamente. Los de arranque están probados contra el emulador
(`seedRecipe`/`seedCategory` con `PATCH …/{col}/{id}?documentId=…`); `uniqueId()` y
`deleteRecipesWithTitle()` se añadieron en P4 con **D8**.

---

## 4. Fases

### 4.1 P0 — Fundación (M)

Prerequisito de todo lo demás.

1. `yarn add -D @playwright/test firebase-tools` (D2) + `npx playwright install chromium`.
2. `playwright.config.ts` (§3.1) · scripts (§3.2) · config `test` en `serve` (H2).
3. **Fix de código (H1)**: conectar Auth al emulador. Punto único recomendado — el factory de
   `FIREBASE_AUTH` en `core/firebase/firebase.providers.ts`:

   ```ts
   { provide: FIREBASE_AUTH, useFactory: () => {
       const auth = getAuth(inject(FIREBASE_APP));
       if (environment.useEmulators) {
         try { connectAuthEmulator(auth, 'http://localhost:9099'); } catch (e) { console.error(e); }
       }
       return auth;
     } },
   ```

   (Mismo patrón defensivo que `recipe.service.ts:57`. Los specs unitarios siguen stubbing el
   token `FIREBASE_AUTH`, así que **no se ven afectados**.)
4. `e2e/fixtures.ts` (bloqueo de analytics, §3.3) · `e2e/support/data.ts` (seeding, §3.5) ·
   `globalSetup` que comprueba emuladores vivos y siembra los 2 usuarios.
5. **Spec humo** `e2e/smoke.spec.ts`: arranque → redirect a `/recipes` → login con
   `e2e@example.com` → aparece el menú del toolbar → logout → vuelve a verse el botón de login.
6. `data-testid` en `login.component.html` y `toolbar.component.html` (§3.4).

**Criterio:** `yarn build` · `yarn test --watch=false` · `npm run lint` · `yarn e2e` ✅, y el
smoke pasa **sin intervención manual** (emuladores y servidor arrancan solos).

### 4.2 P1 — Auth y guards (S) — ✅ cerrada (specs en `e2e/auth.spec.ts`, ver §0.2)

- [x] Validación del form: campo email vacío/inválido → mensajes (`You must enter a value` /
      `Not a valid email`); botón no envía (la URL sigue en `/login`).
- [x] Prefill de `test@mail.com` + password `123456` al cargar (H4: usuario demo) — y el submit
      con ese prefill entra de verdad.
- [x] Toggle de visibilidad de password: `aria-pressed` cambia y el `type` con él.
- [x] **`AuthGuard` sin sesión** (H6): la lista privada **no se pinta** y **no** hay redirect a
      `/login`; comportamiento exacto registrado en §0.2 → **D6 decidida**: issue
      [#91](https://github.com/RicardoR/recipes/issues/91) con el redirect, sin tocar código en
      P1.
- [x] Logout desde el menú del toolbar (`Cerrar sesión`).

**`data-testid`:** `login-*` (completados en P0), `toolbar-menu`, `toolbar-logout`,
`toolbar-login` — **los 8 ya existían desde P0**, P1 no tocó plantillas.

### 4.3 P2 — Listado público + toolbar (S-M) — ✅ cerrada (specs en `e2e/public-list.spec.ts`, ver §0.4)

- [x] Recetas sembradas renderizan en `/recipes` (cubre el `@defer (on viewport)` + OnPush: la
      vista se pinta tras lo asíncrono — riesgo que #83 dejó marcado como smoke manual). Ojo:
      las tarjetas fuera del pliegue siguen en placeholder → `renderAllCards` (H10).
- [x] Filtro por categoría(s) (`category-filter`) → la lista se reduce (y vuelve al
      deseleccionar; ver H11 por el detalle del panel).
- [x] Búsqueda del toolbar (`toolbar-search`) → la lista se reduce y al limpiar vuelve.
- [x] Botón "Ver" (`recipe-view`) → navega a `/recipes/details/:id` (requiere que el documento
      sembrado lleve el campo `id` — §3.5).

**`data-testid`:** `recipe-list`, `recipe-card`, `recipe-card-title`, `recipe-view` (en
`recipe-list.component.html`), `category-filter` (en `recipes-multiple-select.component.html`,
control compartido con el formulario) y `toolbar-search` (ya existía). **5 nuevos en P2** →
inventario total **19**.

### 4.4 P3 — Detalles + permisos (S) — ✅ cerrada (specs en `e2e/recipe-details.spec.ts`, ver §0.5)

- [x] Receta **pública** accesible **sin login**: título + expansión de los paneles de
      ingredientes y pasos (demuestra que los arrays sembrados llegan a la plantilla).
- [x] Receta **privada de otro usuario** sin ser su owner → snackbar
      "No estás autorizado para ver esta receta" + navegación a `/recipes`
      (`private-recipe.guard.ts:27-35`) y `recipe-details-title` ausente tras el redirect.
- [x] Receta **privada propia** (logueado como owner, uid obtenido con `ensureUser`) → se pinta.

**`data-testid`:** `recipe-details-title`, `recipe-details-steps`, `recipe-details-ingredients`
(3 nuevos en P3 → inventario total **22**).

### 4.5 P4 — CRUD en "Mis recetas" (M) — ✅ cerrada (specs en `e2e/my-recipes.spec.ts`, ver §0.6)

- [x] **Crear**: rellena `recipe-card-form` (`form-title`, `form-description` + un ingrediente
  añadido con "Añadir ingrediente") → `form-submit` → aparece en la lista. Validación: el
  botón sigue deshabilitado con campos requeridos vacíos (y con un ingrediente nuevo vacío)
  hasta completarlos.
- [x] **Editar** (`/recipes/edit/:id`): cambiar título → guardar (snackbar *"Receta actualizada"*)
  → **recarga la página** y verifica que el valor nuevo vuelve de Firestore, además de
  comprobarlo en la página de detalles.
- [x] **Borrar**: `recipe-delete` → diálogo (`dialog-cancel` cancela y la receta sigue —
  esperando a que el diálogo se **destruya** antes de reabrirlo, ver H12 —; `dialog-confirm`
  la elimina y desaparece).
- [x] **Limpieza**: ~~`clearFirestore()` en `beforeEach`~~ → **D8**: borrado por etiqueta en
  `afterEach` (`deleteRecipesWithTitle(uniqueId())`), sin tocar los datos de las specs en
  paralelo (§3.5).
- [x] Specs con `e2e@example.com` (H4: el demo lanza excepción).

**`data-testid` (7 nuevos):** `recipe-form`, `form-title`, `form-description`, `form-submit`
(en `recipe-card-form.component.html`), `dialog-confirm`, `dialog-cancel` (en
`delete-recipe-dialog.component.html`) y `recipe-delete` (en `recipe-list.component.html`) →
inventario total **29**.

### 4.6 P5 — Flujo de imagen (M-L) — ✅ cerrada (specs en `e2e/image-flow.spec.ts`, ver §0.7)

Cubre literalmente el checklist de `plan/86` §3.5 punto 5 y `plan/85` F5 punto 4:

- [x] Selección de fichero por la **ruta real del usuario** (`file-input-browse` +
  `page.waitForEvent('filechooser')`, helper `selectFile()`; nunca un diálogo del sistema):
  - [x] preview de la imagen y **nombre en `file-input-display`**;
  - [x] **`required`**: sin foto ⇒ botón "Subir imagen" `[disabled]` y sin error en el DOM;
  - [x] **`imageValidator`**: fichero no-imagen ⇒ `Formato de archivo incorrecto` visible y
        botón deshabilitado — hace falta `touched`, ver **H13**;
  - [x] **`setDisabledState`** → **N/A**: no hay ruta de UI en la app que deshabilite el
        control `photo` (grep en `src/`); cubierto por `file-input.component.spec.ts`
        (`setDisabledState` → `disabled` + `stateChanges`);
  - [x] cambiar de categoría y volver ⇒ el estado del campo no se pierde (H11 en el panel);
- [x] **Ambos caminos de `imgSrc`** (escriben distinto en Firestore):
  - *sin subir*: `imgSrc: ''` → converter → se ve `verduras.jpeg` (`DEFAULT_IMAGE`);
  - *subir*: `pictureForm` (FormGroup aparte, `formControlName="photo"`) → preview +
    `postImage()` a Storage ⇒ se ve la subida (URL con `:9199`);
- [x] **Borrar receta ⇒ `deleteImage` ignora `DEFAULT_IMAGE`** (`recipe.service.ts:267`).

Ficheros de imagen de prueba: `e2e/fixtures/sample.png` (PNG de 1×1) + `e2e/fixtures/sample.txt`.

**`data-testid` (5 nuevos):** `file-input-display`, `file-input-browse`, `file-input-native`
(en `file-input.component.html`), `picture-upload`, `picture-preview` (en
`recipe-card-form.component.html`) → inventario total **34**.

### 4.7 P6 — CI y hardening (M)

1. Job/step en `.github/workflows/node.js.yml`: `yarn e2e` tras `yarn test`
   (Java ya viene en `ubuntu-latest`; caché de navegadores Playwright con `actions/cache`;
   `npx playwright install --with-deps chromium`).
2. Incluir `e2e/**/*.ts` en el target `lint` de `angular.json` (hoy solo `src/**`).
3. `@axe-core/playwright`: 1 spec de accesibilidad por pantalla clave (login, listado, formulario).
4. Anti-flake: `retries: 1` en CI, `trace: on-first-retry`, sin `waitForTimeout` (siempre
   espera por estado visible).
5. Documentar en `AGENTS.md`: scripts nuevos, convención de `data-testid`, cómo correr en local.
6. Opcional: proyectos `firefox` / `webkit`.

---

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Auth no conecta al emulador (H1) | Fix en P0, antes de cualquier spec de login; es el prerequisito |
| `getAnalytics()` con `measurementId` fake ensucia la consola (H5) | `page.route` abortando Google + allowlist en "sin errores de consola" |
| Flakiness por `@defer` / OnPush | Esperas por estado visible (auto-waiting de Playwright), nunca timeouts fijos; `trace` en el primer retry |
| Arranque lento (dev-server + emuladores) | `reuseExistingServer: true` + emuladores persistentes vía `webServer` (arranque en frío ~35 s, specs ~3 s) |
| Los emuladores dejan procesos huérfanos y la corrida siguiente falla (H7) | Wrapper `start-emulators.mjs` (limpia puertos al entrar y al salir) + `gracefulShutdown` con señal al grupo de procesos — verificado en 3 corridas seguidas |
| Datos residuales entre specs | `clearFirestore()` en `beforeEach` + `fullyParallel` con specs que no comparten estado |
| El usuario demo lanza excepción en CRUD (H4) | Dos usuarios sembrados; specs de CRUD con `e2e@example.com` |
| Añadir `data-testid` rompe specs unitarios | Verificado: los specs afectados usan `.overrideTemplate()` o buscan por clase; se re-ejecuta la suite completa en cada fase |
| `firebase-tools` como devDep infla `node_modules` | Aceptado (D2): solo `devDependencies`, no entra en el build |
| Build `test` sin budgets/optimización | Irrelevante para e2e; se sirve tal cual |

---

## 6. Criterios de aceptación globales

- [x] `yarn e2e` verde en local **sin intervención manual** (emuladores + servidor arrancan solos,
      sin procesos huérfanos entre corridas) — verificado en 3 corridas seguidas.
- [x] Los smoke checklists de `plan/85` (F5.4) y `plan/86` (F5.5) quedan cubiertos por specs de
      **P4** y **P5** — ya no hacen falta comprobaciones a mano al cerrar fases.
- [ ] `yarn build` ✅ · `yarn test --watch=false` ✅ (24 ficheros / 139 tests) ·
      `npm run lint` ✅ 0 errores / 0 warnings — **en cada fase**.
- [x] `grep -rn connectAuthEmulator src/` → **2 hits** (import + uso en `firebase.providers.ts`);
      login en emulador verificado por la spec humo.
- [x] Inventario de `data-testid` = inventario de §3.4: **`login` (5) + `toolbar` (9) = 14** en
      P0; P1 no añadió ninguno; **P2 añadió 5** (`recipe-list`, `recipe-card`,
      `recipe-card-title`, `recipe-view`, `category-filter`) → 19; **P3 añadió 3**
      (`recipe-details-title`, `recipe-details-steps`, `recipe-details-ingredients`) → 22;
      **P4 añadió 7** (`recipe-form`, `form-title`, `form-description`, `form-submit`,
      `dialog-confirm`, `dialog-cancel`, `recipe-delete`) → 29; **P5 añadió 5**
      (`file-input-display`, `file-input-browse`, `file-input-native`, `picture-upload`,
      `picture-preview`) → **34** hoy; el resto va por fases.
- [x] **D6 resuelta**: el `AuthGuard` sin sesión (H6) queda cubierto y documentado como está hoy;
      el redirect a `/login` va en el issue
      [#91](https://github.com/RicardoR/recipes/issues/91) (abierto el 08/11; texto en §0.3).
- [ ] CI ejecuta los e2e en verde (P6).
- [ ] `AGENTS.md` documenta los comandos nuevos (P6).

## 7. Fuera de alcance (posibles seguimientos)

- Correr e2e contra el **proyecto de test real** / staging (descartado en D1; solo si se
  necesita validar reglas de seguridad reales o el deploy de hosting).
- Sustituir `test@mail.com` por un usuario de test "limpio" (comportamiento demo es
  intencionado y verificado por specs en P1/P5).
- Redirect automático a `/login` cuando `AuthGuard` cancela la navegación (H6/D6): issue
  [#91](https://github.com/RicardoR/recipes/issues/91) (decisión del 08/11; texto del issue en
  §0.3).
- Visual regression testing (screenshots con baseline) — solo si se pide.
