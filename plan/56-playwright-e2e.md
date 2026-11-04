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
| **P0** | Fundación: deps, config, `connectAuthEmulator`, fixtures, primera spec | ⬜ | Prerequisito de todo lo demás. Ver §4.1 |
| **P1** | Auth y guards | ⬜ | Login, validación, logout, `AuthGuard`. Ver §4.2 |
| **P2** | Listado público + toolbar | ⬜ | Render + `@defer`/OnPush, filtros, búsqueda. Ver §4.3 |
| **P3** | Detalles + permisos | ⬜ | Receta pública/privada/ajena + snackbar. Ver §4.4 |
| **P4** | CRUD en "Mis recetas" | ⬜ | Crear/editar/borrar con diálogo. Ver §4.5 |
| **P5** | Flujo de imagen | ⬜ | El smoke más grande de planes anteriores. Ver §4.6 |
| **P6** | CI y hardening | ⬜ | Job en GitHub, lint de `e2e/`, a11y, anti-flake. Ver §4.7 |

Cada fase cierra con `yarn build` · `yarn test --watch=false` · `npm run lint` · `yarn e2e` en verde.

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

---

## 2. Decisiones registradas (con el usuario)

| # | Decisión | Resultado |
|---|---|---|
| **D1** | Entorno de los tests | **Emuladores locales** (hermético, sin credenciales, sin datos reales, corre en CI/offline). Implica el fix de H1. |
| **D2** | CLI de emuladores | **`firebase-tools` como devDependency** → reproducible en cualquier clon y en CI, versión fijada en `yarn.lock` (hoy es un binario global). |
| **D3** | Momento de activar CI | **En la fase P6**; hasta entonces `yarn e2e` corre solo en local, para no pelear con flakiness mientras se construyen las specs. |
| **D4** | Estrategia de selectores | **`data-testid` en todas** las plantillas implicadas (más estable ante cambios de texto que depender de labels visibles). Convención en §3.4. |

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
"emulators": "firebase emulators:start",
"e2e": "playwright test",
"e2e:ui": "playwright test --ui"
```

`start:e2e` depende de la configuración `test` que hay que añadir en `serve` (H2):
`"test": { "buildTarget": "recipes:build:test" }`.

### 3.3 Bloqueo de red de analytics (fixture)

```ts
// e2e/fixtures.ts
test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
});
```

Y en la aserción "sin errores de consola" se mantiene una **allowlist** de errores esperados
(p.ej. la petición abortada). No se toca `firebase.providers.ts` para esto.

### 3.4 Convención de `data-testid` (D4)

Prefijo por ficha, kebab-case, en inglés (el código es inglés; la UI es español):

| Fichero | Ejemplos |
|---|---|
| `login.component.html` | `login-email`, `login-password`, `login-submit`, `login-toggle-password`, `login-error` |
| `toolbar.component.html` | `toolbar-menu`, `toolbar-logout`, `toolbar-create`, `toolbar-my-recipes`, `toolbar-all-recipes`, `toolbar-search`, `toolbar-login` |
| `recipe-list.component.html` | `recipe-list`, `recipe-card`, `recipe-card-title`, `recipe-card-description`, `recipe-view`, `recipe-delete`, `category-filter` |
| `recipe-card-form.component.html` | `recipe-form`, `form-title`, `form-description`, `form-submit`, `picture-upload`, `form-error-*` |
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
`ownerId`, `steps`, `ingredients`, `imgSrc`, `private`, `categories`):

```
POST http://localhost:8080/v1/projects/demo-recipes/databases/(default)/documents/recipes
Authorization: Bearer owner
```

**Limpieza entre tests** (en `beforeEach` de specs que escriben datos):

```
POST http://localhost:8080/emulator/v1/projects/demo-recipes/databases/(default)/documents/clear
```

Helper central: `e2e/support/data.ts` con `seedUser()`, `seedRecipe()`, `clearFirestore()` —
los specs nunca hablan REST directamente.

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

### 4.2 P1 — Auth y guards (S)

- Validación del form: campo email vacío/inválido → mensajes (`You must enter a value` /
  `Not a valid email`); botón no envía.
- Prefill de `test@mail.com` + password `123456` al cargar (H4: usuario demo).
- Toggle de visibilidad de password: `aria-pressed` cambia y el `type` con él.
- **`AuthGuard` sin sesión** (H6): navegar a `/recipes/my-recipes` sin login → la lista privada
  **no se pinta**; registrar en el plan el comportamiento observado exacto (cancelación de
  navegación, sin redirect automático) — decidir con el usuario si se documenta como
  comportamiento correcto o se abre issue aparte para añadir redirect a `/login`.
- Logout desde el menú del toolbar (`Cerrar sesión`).

**`data-testid`:** `login-*` (completados en P0), `toolbar-menu`, `toolbar-logout`, `toolbar-login`.

### 4.3 P2 — Listado público + toolbar (S-M)

- Recetas sembradas renderizan en `/recipes` (cubre el `@defer (on viewport)` + OnPush: la
  vista se pinta tras lo asíncrono — riesgo que #83 dejó marcado como smoke manual).
- Filtro por categoría(s) (`category-filter`) → la lista se reduce.
- Búsqueda del toolbar (`toolbar-search`) → la lista se reduce y al limpiar vuelve.
- Botón "Ver" (`recipe-view`) → navega a `/recipes/details/:id`.

**`data-testid`:** `recipe-list`, `recipe-card`, `recipe-card-title`, `recipe-view`,
`category-filter`, `toolbar-search`.

### 4.4 P3 — Detalles + permisos (S)

- Receta **pública** accesible **sin login**.
- Receta **privada de otro usuario** sin ser su owner → snackbar
  "No estás autorizado para ver esta receta" + navegación a `/recipes` (`private-recipe.guard.ts:38-44`).
- Receta **privada propia** (logueado como owner) → se pinta.

**`data-testid`:** `recipe-details-title`, `recipe-details-steps`, `recipe-details-ingredients`.

### 4.5 P4 — CRUD en "Mis recetas" (M)

- **Crear**: rellena `recipe-card-form` (título/descripción/ingredientes) → `form-submit` →
  aparece en la lista. Validación: campos requeridos deshabilitan/error.
- **Editar** (`/recipes/edit/:id`): cambiar título → guardar → el cambio persiste (recarga la
  página y verifica).
- **Borrar**: `recipe-delete` → diálogo (`dialog-cancel` cancela y la receta sigue;
  `dialog-confirm` la elimina y desaparece).
- **Limpieza**: `clearFirestore()` en `beforeEach` de las specs que escriben (§3.5).
- Specs con `e2e@example.com` (H4: el demo lanza excepción).

**`data-testid`:** `recipe-form`, `form-title`, `form-description`, `form-submit`,
`dialog-confirm`, `dialog-cancel`.

### 4.6 P5 — Flujo de imagen (M-L) ← el smoke más grande de planes anteriores

Cubre literalmente el checklist de `plan/86` §3.5 punto 5 y `plan/85` F5 punto 4:

- `file-input-native` + `page.setInputFiles()` (sin diálogo del sistema):
  - preview de la imagen y **nombre en `file-input-display`**;
  - **`required`**: borrar el campo `photo` ⇒ botón "Subir imagen" `[disabled]` y el error pinta
    con el matcher correcto;
  - **`imageValidator`**: fichero no-imagen ⇒ `Formato de archivo incorrecto`;
  - **`setDisabledState`**: editar receta con imagen ya guardada / form deshabilitado ⇒
    `file-input-browse` y `file-input-display` deshabilitados (atributo `disabled`, en gris);
  - cambiar de categoría y volver ⇒ el estado del campo no se pierde;
- **Ambos caminos de `imgSrc`** (escriben distinto en Firestore):
  - *sin subir*: `imgSrc: ''` → converter → se ve `verduras.jpeg` (`DEFAULT_IMAGE`);
  - *subir*: `pictureForm` (FormGroup aparte, `formControlName="photo"`) → preview +
    `postImage()` a Storage ⇒ se ve la subida;
- **Borrar receta ⇒ `deleteImage` ignora `DEFAULT_IMAGE`** (`recipe.service.ts:267`).

Fichero de imagen de prueba: `e2e/fixtures/sample.png` (+ uno inválido p.ej. `sample.txt`).

**`data-testid`:** `file-input-display`, `file-input-browse`, `file-input-native`,
`picture-upload`, `picture-preview`.

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
| Arranque lento (dev-server + emuladores) | `reuseExistingServer: true` + emuladores persistentes vía `webServer` |
| Datos residuales entre specs | `clearFirestore()` en `beforeEach` + `fullyParallel` con specs que no comparten estado |
| El usuario demo lanza excepción en CRUD (H4) | Dos usuarios sembrados; specs de CRUD con `e2e@example.com` |
| Añadir `data-testid` rompe specs unitarios | Verificado: los specs afectados usan `.overrideTemplate()` o buscan por clase; se re-ejecuta la suite completa en cada fase |
| `firebase-tools` como devDep infla `node_modules` | Aceptado (D2): solo `devDependencies`, no entra en el build |
| Build `test` sin budgets/optimización | Irrelevante para e2e; se sirve tal cual |

---

## 6. Criterios de aceptación globales

- [ ] `yarn e2e` verde en local **sin intervención manual** (emuladores + servidor arrancan solos).
- [ ] Los smoke checklists de `plan/85` (F5.4) y `plan/86` (F5.5) quedan cubiertos por specs de
      **P4** y **P5** — ya no hacen falta comprobaciones a mano al cerrar fases.
- [ ] `yarn build` ✅ · `yarn test --watch=false` ✅ (24 ficheros / 139 tests) ·
      `npm run lint` ✅ 0 errores / 0 warnings — **en cada fase**.
- [ ] `grep connectAuthEmulator src/` → 1 hit (P0); login en emulador verificado por spec.
- [ ] Inventario de `data-testid` = inventario de §3.4 (sin huecos ni huérfanos).
- [ ] CI ejecuta los e2e en verde (P6).
- [ ] `AGENTS.md` documenta los comandos nuevos (P6).

## 7. Fuera de alcance (posibles seguimientos)

- Correr e2e contra el **proyecto de test real** / staging (descartado en D1; solo si se
  necesita validar reglas de seguridad reales o el deploy de hosting).
- Sustituir `test@mail.com` por un usuario de test "limpio" (comportamiento demo es
  intencionado y verificado por specs en P1/P5).
- Redirect automático a `/login` cuando `AuthGuard` cancela la navegación (H6) — issue aparte
  si en P1 se confirma que el comportamiento actual no es el deseado.
- Visual regression testing (screenshots con baseline) — solo si se pide.
