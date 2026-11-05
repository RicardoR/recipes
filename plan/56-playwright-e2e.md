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
| **P1** | Auth y guards | ⬜ | Login, validación, logout, `AuthGuard`. Ver §4.2 |
| **P2** | Listado público + toolbar | ⬜ | Render + `@defer`/OnPush, filtros, búsqueda. Ver §4.3 |
| **P3** | Detalles + permisos | ⬜ | Receta pública/privada/ajena + snackbar. Ver §4.4 |
| **P4** | CRUD en "Mis recetas" | ⬜ | Crear/editar/borrar con diálogo. Ver §4.5 |
| **P5** | Flujo de imagen | ⬜ | El smoke más grande de planes anteriores. Ver §4.6 |
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

---

## 2. Decisiones registradas (con el usuario)

| # | Decisión | Resultado |
|---|---|---|
| **D1** | Entorno de los tests | **Emuladores locales** (hermético, sin credenciales, sin datos reales, corre en CI/offline). Implica el fix de H1. |
| **D2** | CLI de emuladores | **`firebase-tools` como devDependency** → reproducible en cualquier clon y en CI, versión fijada en `yarn.lock` (hoy es un binario global). |
| **D3** | Momento de activar CI | **En la fase P6**; hasta entonces `yarn e2e` corre solo en local, para no pelear con flakiness mientras se construyen las specs. |
| **D4** | Estrategia de selectores | **`data-testid` en todas** las plantillas implicadas (más estable ante cambios de texto que depender de labels visibles). Convención en §3.4. |
| **D5** | Ruido de analytics en consola (revisada en P0) | Primero se probó **solo bloquear la red** (§3.3 original) y **no bastó**: el SDK igualmente hace `console.error` (`Installations: …`). Aplicado además un guard en `AnalyticsService`: con `environment.useEmulators` no se inicializa analytics (la app ya degrada a `console.warn`, igual que cuando `isSupported()` es falso). Los hosts de Google se siguen bloqueando por si acaso. **Resultado: `expectNoConsoleErrors` estricto, sin allowlist.** |

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

**Limpieza entre specs** — el emulador **no** tiene endpoint `clear` (H8), así que
`clearFirestore()` lista `recipes` + `categories` y borra documento a documento
(`Authorization: Bearer owner`). Se ejecuta en el `globalSetup` para partir de una BD vacía; las
specs de P4 que escriban repetirán el patrón en su `beforeEach`.

Helper central: `e2e/support/data.ts` con `ensureUser()`, `seedRecipe()`, `clearFirestore()`,
`waitForEmulators()` — los specs nunca hablan REST directamente. Los cuatro están probados contra
el emulador en P0 (`seedRecipe` con `PATCH …/{col}/{id}?documentId=…`).

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
- [ ] Los smoke checklists de `plan/85` (F5.4) y `plan/86` (F5.5) quedan cubiertos por specs de
      **P4** y **P5** — ya no hacen falta comprobaciones a mano al cerrar fases.
- [ ] `yarn build` ✅ · `yarn test --watch=false` ✅ (24 ficheros / 139 tests) ·
      `npm run lint` ✅ 0 errores / 0 warnings — **en cada fase**.
- [x] `grep -rn connectAuthEmulator src/` → **2 hits** (import + uso en `firebase.providers.ts`);
      login en emulador verificado por la spec humo.
- [x] Inventario de `data-testid` = inventario de §3.4: **`login` (5) + `toolbar` (9) = 14** en P0;
      el resto va por fases.
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
