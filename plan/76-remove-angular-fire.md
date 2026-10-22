# Plan — Issue #76: eliminar `@angular/fire` y migrar al SDK modular de `firebase` (desbloquear Angular 22)

> Objetivo: quitar la dependencia `@angular/fire` del proyecto `recipes` sustituyéndola por el **SDK
> modular oficial `firebase`** (que es framework-agnóstico y **no** tiene peer deps con Angular), para
> desbloquear la actualización a **Angular 22** sin necesidad de `overrides` ni `--legacy-peer-deps`.
>
> El bloqueo real son los *peer deps* `@angular/core: ^21.0.0` de `@angular/fire`. `firebase@11.9.0`
> (el SDK puro) **no declara ninguna peer dep sobre Angular** ⇒ funciona con Angular 22 tal cual.

Repo: `RicardoR/recipes` · Issue: https://github.com/RicardoR/recipes/issues/76

---

## 0. Progreso de la implementación

Rama: `76-remove-angularfire`

| Fase | Tarea | Estado | Notas |
|---|---|---|---|
| **F0** | Decisiones D1–D6 + baseline | ✅ | Rama `76-remove-angularfire`. Baseline: `lint` ✅ · `test` ✅ 24 ficheros / 135 tests · `build` ✅ 1.65 MB. Ver §0.1 (dual-tree Firebase) |
| **F1** | `firebase.providers.ts` (tokens + factories) + registrar en `app.config.ts` (coexistencia) | ✅ | Creado con `inject()` dentro de las factories (el `inject: []` de metadata da TS2353 con `makeEnvironmentProviders`). Coexiste con `@angular/fire`. Build/lint/test ✅ |
| **F2** | Migrar `RecipeService` (Firestore + Storage) | ⬜ | Quitar `provideFirestore`/`provideStorage` |
| **F3** | Migrar `AnalyticsService` | ⬜ | Quitar `provideAnalytics` |
| **F4** | Migrar `AuthService` (compat → modular) | ⬜ | El mayor cambio; reescribe el spec con `vi.mock` |
| **F5** | `app.config.ts` solo con los providers nuevos | ⬜ | Quitar `provideFirebaseApp` y `@angular/fire/app` |
| **F6** | Eliminar `@angular/fire` (+ `rxfire`) de `package.json` | ⬜ | `npm install` + verificación completa |
| **F7** | Actualizar a Angular 22 | ⬜ | `ng update @angular/core@22 @angular/cli@22` |

---

### 0.1 Hallazgo del baseline: dual-tree de Firebase (valida la migración)

El `test` inicial **falló** con `SyntaxError: The requested module '@firebase/util' does not provide an
export named 'updateEmulatorBanner'` en 15 de 24 suites. Causa: `@angular/fire@21.0.0-rc.0` declara
dependencia de **`firebase@^12.4.0`**, pero el proyecto usa **`firebase@11.9.0`** ⇒ npm instaló **dos
árboles**:

- top-level: `firebase@11.9.0` → `@firebase/util@1.12.0`
- anidado bajo `@angular/fire`: `firebase@12.19.0` → `@firebase/util@1.15.3`

El `node_modules` quedó incoherente (parte de `@firebase/*` v11 importaban `updateEmulatorBanner`, que el
`@firebase/util` hoisted no exportaba en el build que resolvía el test). Tras **`rm -rf node_modules` +
`npm ci`** el baseline quedó **verde** (24/135). Esto confirma que el propio `@angular/fire` provoca un
árbol de dependencias frágil — más motivo para eliminarlo. **No** es un problema del código de la app.

---

## 1. El bloqueo (verificado en el repo)

`package.json` declara `"@angular/fire": "21.0.0-rc.0"`, cuyas peer deps exigen `@angular/core: ^21.0.0`.
El proyecto está en Angular **21.0.8** y se quiere subir a **22** ⇒ `ng update` falla por ERESOLVE.

Verificado con `npm view`:

| Versión de `@angular/fire` | peer `@angular/core` | ¿Soporta Angular 22? |
|---|---|---|
| `20.1.1` (latest estable) | `^20.0.0` | ❌ |
| `21.0.0-rc.2` (next) | `^21.2.0` | ❌ |
| `21.0.1-canary` | `^21.2.0` | ❌ |

**Ninguna versión soporta Angular 22.** En cambio, `firebase@11.9.0` (el SDK puro) tiene
`peerDependencies: {}` ⇒ sin ninguna restricción sobre Angular. `@angular/fire` es solo una capa de
conveniencia (DI + re-exports) sobre ese SDK; eliminarla desbloquea el upgrade.

---

## 2. Superficie de uso íntegra de `@angular/fire` (verificada con `grep`)

Solo **7 ficheros** la usan. Los guards y el resto de componentes **no** tocan Firebase directamente
(inyectan `AuthService`/`RecipeService`/`AnalyticsService`):

| Fichero | Qué importa de `@angular/fire` | ¿Existe igual en `firebase/*`? |
|---|---|---|
| `app.config.ts` | `provideFirebaseApp/initializeApp`, `provideFirestore/getFirestore`, `provideAnalytics/getAnalytics`, `provideAuth/getAuth`, `provideStorage/getStorage`, `FIREBASE_OPTIONS` (compat) | ⚠️ Son *sugar* de DI → hay que sustituirlos por `InjectionToken` + `useFactory` |
| `features/recipes/services/recipe/recipe.service.ts` | firestore: `addDoc, collection, connectFirestoreEmulator, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc, where` · storage: `connectStorageEmulator, deleteObject, getDownloadURL, ref, uploadBytesResumable` + tipos `Firestore`, `Storage`, `FirebaseStorage` | ✅ **Idéntico** en `firebase/firestore` y `firebase/storage` |
| `core/auth/services/auth.service.ts` | `AngularFireAuth` (compat): `signInWithEmailAndPassword`, `signOut`, `authState` | ❌ **Único uso realmente específico** → migrar a `firebase/auth` modular |
| `shared/services/analytics/analytics.service.ts` | `Analytics, isSupported, logEvent` | ✅ En `firebase/analytics` |

Specs a actualizar: `recipe.service.spec.ts`, `analytics.service.spec.ts`, `auth.service.spec.ts`.

---

## 3. Hallazgos técnicos que condicionan la migración

### H1 — Los tipos del SDK modular difieren de los de `@angular/fire`

`@angular/fire` expone clases-inyectables `Firestore`, `Storage`, `Auth`, `Analytics`. El SDK modular
exporta **tipos de instancia** distintos (verificado en los `.d.ts` de `@firebase/*`):

| Token @angular/fire | Tipo en el SDK modular | Origen |
|---|---|---|
| `Firestore` | `Firestore` | `firebase/firestore` |
| `Storage` | **`FirebaseStorage`** (⚠️ no `Storage`; `getStorage(): FirebaseStorage`) | `firebase/storage` |
| `Auth` | `Auth` (⚠️ la clase `Auth` del SDK NO es inyectable; es la instancia) | `firebase/auth` |
| `Analytics` | `Analytics` | `firebase/analytics` |

Consecuencia práctica: en `recipe.service.ts`, el cast `ref(this.storage as unknown as FirebaseStorage, …)`
pasa a ser innecesario (`this.storage` ya **es** `FirebaseStorage`). Limpieza incluida en F2.

### H2 — El SDK modular no inyecta: hay que crear `InjectionToken`s

`getFirestore()`, `getAuth()`, etc. **no** son providers de Angular. Hay que declarar tokens propios y
proveerlos con `useFactory`. Ver §5.1.

### H3 — `initializeApp()` es **idempotente** (garantiza la coexistencia incremental)

Verificado ejecutando el SDK del repo: la segunda `initializeApp(cfg)` devuelve **la misma instancia**
(`¿misma instancia? true`, `getApps().length === 1`), **no** lanza "app already exists". ⇒ Durante las
fases intermedias pueden coexistir `provideFirebaseApp` (de `@angular/fire`) y el `FIREBASE_APP` nuevo
sin conflicto. Es lo que hace segura la migración incremental fase a fase.

### H4 — `getAnalytics()` lanza en entornos sin soporte → la inyección debe seguir siendo **diferida**

`AnalyticsService` hoy inyecta el `Analytics` de forma **diferida** (`this.injector.get(Analytics)`
dentro de `isSupported().then(…)`), precisamente para no ejecutar `getAnalytics()` cuando no hay
soporte (p. ej. en **jsdom**, donde `isSupported()` → `false`). Si se cambiara a un inyectado de campo
(`inject(FIREBASE_ANALYTICS)`), la factory se ejecutaría en la construcción del servicio y
`getAnalytics()` lanzaría. **Obligatorio mantener el patrón de inyección diferida con `Injector`.**

### H5 — Auth es la única pieza `compat` y la que exige reescribir el test

`auth.service.ts` usa `@angular/fire/compat/auth` (`AngularFireAuth`), cuya API son **métodos sobre un
objeto inyectable**. El SDK modular usa **funciones libres** (`signInWithEmailAndPassword(auth, …)`,
`signOut(auth)`, `onAuthStateChanged(auth, cb)`), que **no** se pueden mockear inyectando un objeto:
hay que usar `vi.mock('firebase/auth', …)`. El repo aún **no** usa `vi.mock` en ningún spec (verificado)
— es estándar de Vitest, bajo riesgo, pero es un cambio de patrón en el test.

### H6 — `rxfire` es dependencia directa pero sin uso en el código de la app

`package.json` lista `"rxfire": "6.1.0"` en `dependencies` y `grep` confirma **cero** uso directo en
`src/`. Solo lo necesita `@angular/fire`. Se puede eliminar junto con ella (F6).

---

## 4. Decisiones de diseño (✅ propuestas — cerrar con el usuario)

| # | Decisión | Valor elegido | Consecuencia |
|---|---|---|---|
| **D1** | Estrategia de DI | **`InjectionToken` propios** (`FIREBASE_APP`, `FIRESTORE`, `FIREBASE_AUTH`, `FIREBASE_STORAGE`, `FIREBASE_ANALYTICS`) en un fichero nuevo `firebase.providers.ts` | Separa la config de Firebase de `app.config.ts`; consumidores importan tokens, no la librería vieja. |
| **D2** | Auth | **Migrar a `firebase/auth` modular** (fuera de `compat`) | Elimina el último rastro legacy; exige `vi.mock` en el spec (H5). |
| **D3** | `FIREBASE_OPTIONS` | **Eliminar** | Solo lo consumía `@angular/fire/compat`; tras migrar Auth ya nadie lo usa. |
| **D4** | `AnalyticsService` | **Conservar la inyección diferida** con `Injector` + `isSupported()` (H4) | Mismo comportamiento; evita `getAnalytics()` en jsdom. |
| **D5** | Orden | **Incremental por producto** (Firestore+Storage → Analytics → Auth), con coexistencia temporal de providers (H3) | Cada fase deja `build`+`test`+`lint` en verde y es un commit pequeño. |
| **D6** | `rxfire` | **Eliminar** junto con `@angular/fire` (H6) | Limpieza; sin uso directo en `src/`. |

---

## 5. Arquitectura de la sustitución

### 5.1 Fichero nuevo: `src/app/core/firebase/firebase.providers.ts`

```ts
import {InjectionToken} from '@angular/core';
import {FirebaseApp, initializeApp} from 'firebase/app';
import {Firestore, getFirestore} from 'firebase/firestore';
import {Auth, getAuth} from 'firebase/auth';
import {FirebaseStorage, getStorage} from 'firebase/storage';
import {Analytics, getAnalytics} from 'firebase/analytics';
import {EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';
import {environment} from '../../../environments/environment';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FirebaseApp');
export const FIRESTORE = new InjectionToken<Firestore>('Firestore');
export const FIREBASE_AUTH = new InjectionToken<Auth>('Auth');
export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage>('FirebaseStorage');
export const FIREBASE_ANALYTICS = new InjectionToken<Analytics>('Analytics');

export const firebaseProviders: EnvironmentProviders = makeEnvironmentProviders([
  {provide: FIREBASE_APP, useFactory: () => initializeApp(environment.firebase)},
  {provide: FIRESTORE, useFactory: (app: FirebaseApp) => getFirestore(app), inject: [FIREBASE_APP]},
  {provide: FIREBASE_AUTH, useFactory: (app: FirebaseApp) => getAuth(app), inject: [FIREBASE_APP]},
  {provide: FIREBASE_STORAGE, useFactory: (app: FirebaseApp) => getStorage(app), inject: [FIREBASE_APP]},
  // Ojo (H4): esta factory sólo se ejecuta si alguien inyecta FIREBASE_ANALYTICS (AnalyticsService lo
  // hace de forma diferida). No usar `inject(FIREBASE_ANALYTICS)` en campo.
  {provide: FIREBASE_ANALYTICS, useFactory: (app: FirebaseApp) => getAnalytics(app), inject: [FIREBASE_APP]},
]);
```

Notas:
- Cada factory recibe `FIREBASE_APP` explícitamente ⇒ sin depender del "default app" implícito y sin
  carreras de orden.
- El `initializeApp` del token `FIREBASE_APP` convive con el de `@angular/fire` durante las fases
  intermedias (idempotente, H3).

### 5.2 Consumidores: cambian imports y tokens, no la lógica

| De (`@angular/fire/...`) | A (`firebase/...`) | Token injectado |
|---|---|---|
| `inject(Firestore)` | `inject(FIRESTORE)` | `FIRESTORE` |
| `inject(Storage)` (+ cast) | `inject(FIREBASE_STORAGE)` (sin cast) | `FIREBASE_STORAGE` |
| `inject(AngularFireAuth)` | `inject(FIREBASE_AUTH)` + fn. libres | `FIREBASE_AUTH` |
| `injector.get(Analytics)` | `injector.get(FIREBASE_ANALYTICS)` (diferido) | `FIREBASE_ANALYTICS` |

---

## 6. Detalle por fase (ejecutable e incremental; `build`+`test`+`lint` en verde al final de cada una)

### F0 — Baseline y rama
1. Crear rama. Ejecutar y registrar baseline: `npm run lint`, `npm run build`, `npm test`
   (~24 ficheros / 135 tests). Sirve de referencia para detectar regresiones.

### F1 — `firebase.providers.ts` + registro en `app.config.ts` (coexistencia)
1. Crear `src/app/core/firebase/firebase.providers.ts` (§5.1).
2. En `app.config.ts`: importar `firebaseProviders` y añadirlo a `providers`. **Mantener** todos los
   `provide*` de `@angular/fire` (aún sin consumidores nuevos; coexisten sin conflicto por H3).
3. Verificar: `build`, `test`, `lint`.

### F2 — Migrar `RecipeService` (Firestore + Storage)
1. `recipe.service.ts`:
   - Imports de storage → `firebase/storage`: `connectStorageEmulator, deleteObject, getDownloadURL,
     ref, uploadBytesResumable, FirebaseStorage, Storage` (tipo) → tipar `this.storage` como
     `FirebaseStorage`.
   - Imports de firestore → `firebase/firestore`: `addDoc, collection, connectFirestoreEmulator,
     deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc, where, Firestore`.
   - `inject(Firestore)` → `inject(FIRESTORE)`; `inject(Storage)` → `inject(FIREBASE_STORAGE)`.
   - Eliminar el cast `as unknown as FirebaseStorage` (H1): `this.storage` ya es `FirebaseStorage`.
2. `recipe.service.spec.ts`: `{provide: Firestore, useValue: {}}` → `{provide: FIRESTORE, useValue: {}}`;
   `{provide: Storage, useValue: {}}` → `{provide: FIREBASE_STORAGE, useValue: {}}`. El resto igual
   (el spec mockea métodos del servicio con `vi.spyOn`; el constructor no conecta emuladores porque
   `useEmulators:false` en el entorno de test).
3. `app.config.ts`: quitar `provideFirestore` y `provideStorage` (y sus imports de `@angular/fire`).
4. Verificar: `build`, `npx ng test --include="**/recipe.service.spec.ts"`, `test` completo, `lint`.

### F3 — Migrar `AnalyticsService`
1. `analytics.service.ts`: import de `@angular/fire/analytics` → `firebase/analytics`
   (`Analytics, isSupported, logEvent`). **Mantener** la inyección diferida (H4):
   `this.injector.get(FIREBASE_ANALYTICS)` dentro de `isSupported().then(…)`.
2. `analytics.service.spec.ts`: sustituir `provideFirebaseApp`/`provideAnalytics` de `@angular/fire`
   por los providers nuevos (p. ej. `...firebaseProviders` o `{provide: FIREBASE_APP, useFactory: …}`).
   En jsdom `isSupported()`→`false`, así que `getAnalytics()` no se ejecuta (solo se testea "service
   created").
3. `app.config.ts`: quitar `provideAnalytics` (y su import).
4. Verificar: `build`, `npx ng test --include="**/analytics.service.spec.ts"`, `test`, `lint`.

### F4 — Migrar `AuthService` (compat → modular) ← mayor cambio
1. `auth.service.ts`:
   - `inject(AngularFireAuth)` → `inject(FIREBASE_AUTH)`.
   - `login`: `this.auth.signInWithEmailAndPassword(e, p)` → `signInWithEmailAndPassword(this.auth, e, p)`
     (import de `firebase/auth`; devuelve `Promise<UserCredential>`, mismo `.then(() => navigate)`).
   - `logout`: `this.auth.signOut()` → `signOut(this.auth)`.
   - `authState`: sustituir `this.auth.authState` (Observable de compat) por un Observable propio:
     ```ts
     private get authState(): Observable<User | null> {
       return new Observable((subscriber) => {
         const unsub = onAuthStateChanged(this.auth, (user) => subscriber.next(user));
         return () => unsub();
       });
     }
     ```
     `initAuthListener()` conserva `.pipe(take(1), map(…))` igual que ahora.
2. `auth.service.spec.ts` → reescribir con `vi.mock` (H5):
   ```ts
   const {mockSignIn, mockSignOut, mockOnAuthStateChanged} = vi.hoisted(() => ({
     mockSignIn: vi.fn(), mockSignOut: vi.fn(), mockOnAuthStateChanged: vi.fn(),
   }));
   vi.mock('firebase/auth', () => ({
     signInWithEmailAndPassword: mockSignIn,
     signOut: mockSignOut,
     onAuthStateChanged: mockOnAuthStateChanged,
   }));
   ```
   - Providers: `{provide: FIREBASE_AUTH, useValue: {}}` (instancia falsa; las funciones mock la ignoran
     o la reciben como 1er argumento) + `{provide: Router, useValue: routerSpy}`.
   - `login`: `mockSignIn.mockResolvedValue({})`; asertar `mockSignIn` llamado con
     `(authFalso, email, password)` y la navegación.
   - `logout`: `mockSignOut.mockResolvedValue(undefined)`; asertar llamada + `currentUser` undefined +
     navegación.
   - `initAuthListener`: `mockOnAuthStateChanged.mockImplementation((_auth, cb) => { cb(userMock); return vi.fn(); })`
     → `service.initAuthListener()` emite `true`; con `cb(undefined)` → `false`.
   - Los tests de `isDemoUser` y `currentUser` quedan igual (no tocan Firebase).
3. `app.config.ts`: quitar `provideAuth`, `{provide: FIREBASE_OPTIONS, useValue: …}` y los imports
   `@angular/fire/auth` + `@angular/fire/compat`.
4. Verificar: `build`, `npx ng test --include="**/auth.service.spec.ts"`, `test` completo, `lint`.
   **Check manual**: `npm run start:debugMode`, login/logout contra Firebase real/test.

### F5 — `app.config.ts` solo con los providers nuevos
1. Quitar `provideFirebaseApp(() => initializeApp(...))` y el import `@angular/fire/app`.
   `app.config.ts` queda: `...firebaseProviders` + router/material/sw/error-handler/locale (sin Firebase).
2. Verificar: `build`, `test` completo, `lint`. **Check manual**: arranque completo (`npm start`),
   login, listado de recetas, subida/borrado de imagen, analytics (no crash).

### F6 — Eliminar `@angular/fire` (+ `rxfire`)
1. `package.json`: borrar `"@angular/fire"` y `"rxfire"` de `dependencies`.
2. `npm install` (regenera el lockfile). Confirmar **sin ERESOLVE**.
3. Verificación completa: `npm run lint`, `npm test`, `npm run build`, y
   `npm ls @angular/fire rxfire` → vacío. `grep -rn "@angular/fire" src/` → 0 resultados.
4. Commit.

### F7 — Actualizar a Angular 22
1. Sin `@angular/fire`, no hay peer deps que bloqueen. Ejecutar
   `ng update @angular/core@22 @angular/cli@22`.
2. Aplicar migraciones schematics que proponga; revisar breaking changes de v22 (signals, zone,
   Material/CDK, `provideAnimations` → posible deprecation).
3. Verificar: `lint`, `test`, `build`; smoke test manual completo.
4. (Nota sobre el gestor de paquetes: el usuario indicó que eliminará/usa el lockfile a su manera;
   no forma parte de este plan.)

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `getAnalytics()` lanza en jsdom/entornos sin soporte | H4: conservar inyección **diferida** con `Injector`; la factory sólo corre si hay soporte. Test en jsdom no la dispara. |
| Romper el flujo de Auth (login/listener) al pasar de compat a modular | F4 aislada + reescritura del spec con `vi.mock` + check manual de login/logout contra Firebase. El `Observable` de `onAuthStateChanged` reproduce el comportamiento de `authState`. |
| Coexistencia de providers en fases intermedias | H3: `initializeApp` idempotente ⇒ sin "app already exists". Cada fase quita el `provide*` correspondiente en cuanto su consumidor migra. |
| Regresión silenciosa en recetas/storage | F2 verificada con spec dirigido + suite completa + build de producción; los mocks de tokens (`{}`) se comportan igual que antes. |
| Tipos (`Storage` vs `FirebaseStorage`) | H1: tipar `FIREBASE_STORAGE` como `FirebaseStorage`; se elimina un cast. |

---

## 8. Criterios de aceptación global

- `grep -rn "@angular/fire" src/` → **0** resultados.
- `package.json` sin `@angular/fire` ni `rxfire`; `npm install` limpio (sin ERESOLVE).
- `npm run lint` · `npm test` · `npm run build` en verde (≥ baseline de F0).
- `ng update @angular/core@22 @angular/cli@22` **sin** error de peer deps ni de lockfile.
- Smoke test manual: login/logout, CRUD de recetas, subida/borrado de imagen, analytics sin crash.
