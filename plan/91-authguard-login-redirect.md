# Plan — Issue #91: `AuthGuard` sin sesión → redirect a `/login` con `returnUrl`

> Objetivo: al abrir una ruta protegida sin sesión, **redirigir a `/login` conservando la ruta
> original** en el query param `returnUrl` (y volver a ella tras autenticarse) en lugar de dejar
> la pantalla en blanco que produce hoy el cancel de navegación del router.

Repo: `RicardoR/recipes` · Issue: https://github.com/RicardoR/recipes/issues/91
Origen: hallazgo **H6 / D6** de `plan/56-playwright-e2e.md` §0.2/§0.3 (P1 de los e2e).

---

## 0. Progreso de la implementación

Rama: `91-authguard-login-redirect` (creada desde `master`)

| Fase | Tarea | Estado | Notas |
|---|---|---|---|
| **P1** | `AuthGuard` devuelve un `UrlTree` a `/login?returnUrl=…` (firma `(route, state)`) + spec unit | ✅ | `canActivate` pasa a `Observable<boolean \| UrlTree>`; sin sesión → `UrlTree` con `returnUrl = state.url`. Spec con `RouterModule.forRoot([])`: `true` con sesión / serializado a `/login?returnUrl=%2Frecipes%2Fmy-recipes` sin ella. `canLoad` intacto (D3) |
| **P2** | `returnUrl` consumido en el login (`LoginComponent` → `AuthService.login`) y vuelta a la ruta original + specs unit | ✅ | `login(authData, returnUrl?)` → `navigateByUrl` con la validación D2 (`//evil.com` y `https://…` caen al default) · `LoginComponent.returnUrl` lee `snapshot.queryParamMap` (`ActivatedRoute` mockeado como en `recipe-layout`) |
| **P3** | Specs e2e de `auth.spec.ts` (redirect + round-trip) y verificación completa `build` · `test` · `lint` · `e2e` | ✅ | `e2e/auth.spec.ts` → **7 specs**: se sustituyó el de pantalla en blanco por `redirects to /login with the requested route as returnUrl` (sobre `my-recipes` y `new`) y `returns to the requested route after signing in`. `yarn e2e` ✅ **24 specs** (21/21 con `--repeat-each=3`) · lint ✅ 0/0 · unit ✅ **24/143** (+4) · build ✅ |

Cada fase cierra con `yarn build` · `yarn test --watch=false` · `npm run lint` · `yarn e2e` en verde.

## 1. Comportamiento actual y esperado

- **Actual** (cubierto por la spec e2e `AuthGuard › cancels the navigation without redirecting`):
  sin sesión, `AuthGuard.canActivate()` devuelve `initAuthListener()` → emite `false` → el router
  **cancela** la navegación, restaura la URL inicial (`/`) y deja el outlet vacío → pantalla en
  blanco. Recargar muestra la lista pública (el `**` redirige a `recipes`).
- **Esperado**: URL `/login?returnUrl=%2Frecipes%2Fmy-recipes`, formulario de login visible y,
  tras autenticarse, navegación de vuelta a `/recipes/my-recipes`.

## 2. Decisiones

- **D1 — `UrlTree` desde el guard, no `router.navigate`.** El guard devuelve
  `router.createUrlTree(['/login'], {queryParams: {returnUrl: state.url}})` en lugar de navegar a
  mano y devolver `false`: el router resuelve la redirección en la misma navegación (sin carrera
  cancel + segundo navigate) y es la API recomendada para guards.
- **D2 — solo rutas internas en `returnUrl`.** `AuthService.login` solo respeta un `returnUrl` que
  empieza por `/` y **no** por `//` (evita open redirect a `//evil.com`); cualquier otro valor cae
  al destino por defecto `/recipes/my-recipes`. El valor que pinta el guard viene del router
  (`state.url`), pero el query param es manipulable a mano, así que la validación va en el servicio.
- **D3 — `canLoad` queda intacto.** Ninguna ruta de la app usa `canLoad` (solo `canActivate`), así
  que es código muerto: no se toca para no ampliar el diff. Candidato a eliminación en una issue de
  limpieza (junto al de `AuthReadyGuard`).
- **D4 — fuera de alcance**: `PrivateRecipeGuard` (receta privada ajena sin sesión) sigue
  redirigiendo a `/recipes` con snackbar; comportamiento cubierto por `e2e/recipe-details.spec.ts`
  y no forma parte de #91.

## 3. Fases

### P1 — `AuthGuard` redirige a `/login` con `returnUrl` (S)

- `src/app/core/auth/guards/auth.guard.ts`: `canActivate(route, state)` pasa a devolver
  `Observable<boolean | UrlTree>`; sin sesión → `UrlTree` a `/login` con
  `returnUrl = state.url`. `canLoad` sin cambios (D3).
- `src/app/core/auth/guards/auth.guard.spec.ts`: proveer router (`RouterModule.forRoot([])`) y
  cubrir los dos casos (`true` con sesión / `UrlTree` serializado a
  `/login?returnUrl=%2Frecipes%2Fmy-recipes` sin sesión).

### P2 — el login vuelve a la ruta original (S)

- `src/app/core/auth/services/auth.service.ts`: `login(authData, returnUrl?)` →
  `router.navigateByUrl(...)` con la validación D2 (por defecto `/recipes/my-recipes`).
- `src/app/core/auth/components/login/login.component.ts`: leer `returnUrl` del query param en
  `ngOnInit` (`ActivatedRoute.snapshot.queryParamMap`) y pasárselo a `login`.
- Specs unit: `auth.service.spec.ts` (navegación al `returnUrl` válido, por defecto y con
  `//evil.com` rechazado) y `login.component.spec.ts` (propaga el query param; `ActivatedRoute`
  mockeado como en `recipe-layout.component.spec.ts`).

### P3 — e2e y verificación (S)

- `e2e/auth.spec.ts`: sustituir `AuthGuard › cancels the navigation without redirecting to /login`
  por specs que asserten el redirect a `/login?returnUrl=…` (rutas protegidas `my-recipes` y
  `new`) y el **round-trip**: submit del login → vuelta a la ruta original con toolbar logueado.
- Verificación: `yarn build` · `yarn test --watch=false` · `npm run lint` · `yarn e2e`
  (repetir `--repeat-each` para descartar flake).

## 4. Verificación

- [x] `yarn build` ✅
- [x] `yarn test --watch=false` ✅ (24 ficheros / **143** tests, +4)
- [x] `npm run lint` ✅ 0/0
- [x] `yarn e2e` ✅ **24 specs** (los 7 de `auth.spec.ts` ×3 → 21/21, sin `expectNoConsoleErrors` rojos)
- [x] Smoke manual: abrir `/recipes/my-recipes` sin sesión → `/login?returnUrl=…` → login →
      de vuelta en `/recipes/my-recipes` — **cubierto por la spec e2e**
      `AuthGuard › returns to the requested route after signing in`.
