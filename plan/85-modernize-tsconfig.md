# Plan — Issue #85: Modernizar `tsconfig.json` (`module: "preserve"` + `isolatedModules`)

> Objetivo: alinear el `tsconfig.json` con el scaffold de Angular 22 —`module: "preserve"` +
> `isolatedModules: true`, sin `moduleResolution` redundante— y resolver de paso las dos decisiones
> que la issue deja abiertas: `useDefineForClassFields` y los opcionales del strict del scaffold
> (`noImplicitOverride`, `noPropertyAccessFromIndexSignature`). Todo con build/test/lint verdes y
> smoke manual al final.

Repo: `RicardoR/recipes` · Issue: https://github.com/RicardoR/recipes/issues/85

---

## 0. Progreso de la implementación

Rama: `85-modernize-tsconfig` (creada desde `master`)

| Fase | Tarea | Estado | Notas |
|---|---|---|---|
| **F0** | Baseline verde antes de tocar nada | ✅ | `yarn build` ✅ 1.57 MB (< 2 MB) · `yarn test --watch=false` ✅ 24 ficheros / 135 tests · `npm run lint` ✅ 0 errores (14 warnings OnPush aceptados, trazados en #83) |
| **F1** | `module: "preserve"` + `isolatedModules: true`; quitar `moduleResolution` | ✅ | Cambio mínimo ya probado en la auditoría de #81. Verificado en aislamiento: build ✅ 1.56 MB, test ✅ 24/135. Ver §3.1 |
| **F2** | `useDefineForClassFields`: probar `true` (default del scaffold) — keep-if-green | ✅ | **D1 resuelta → `true`**: se borró la línea (hereda el default, como el scaffold). Build ✅ 1.56 MB · test ✅ 24/135. Smoke manual de F5 pendiente de confirmación del usuario. Ver §2 D1 |
| **F3** | Opcionales del strict: `noImplicitOverride` + `noPropertyAccessFromIndexSignature` | ✅ | **D2 resuelta → ambos**: `noImplicitOverride` 0 cambios (0 herencias, como se previó). `noPropertyAccessFromIndexSignature` dio **13 errores TS4111** en 2 ficheros, todos triviales (acceso por corchetes): `recipe-card-form.component.ts` (10, `form!: FormGroup` sin genérico ⇒ index signature) y `toolbar.component.ts` (3, `route.snapshot.data`). Arreglados → build/test ✅. Ver §2 D2 |
| **F4** | Endurecer el `const enum DatabaseCollectionsNames` | ✅ | `recipe.service.ts:33`: quitado `const` → `enum` normal (8 usos same-file intactos). Build/test ✅. Ver §3.4 |
| **F5** | Verificación global + smoke manual | 🟡 | `yarn build` ✅ 1.56 MB · `yarn test --watch=false` ✅ 24/135 · `npm run lint` ✅ 0 errores (14 warnings OnPush aceptados). **Smoke manual: pendiente del usuario** (arranque, login, CRUD, file-input/formularios) |

---

## 1. Contexto — estado actual vs scaffold de Angular 22

`tsconfig.json` (líneas 15-20) quedó con el formato anterior al upgrade de #81:

| Opción | Repo actual | Scaffold v22 | Acción |
|---|---|---|---|
| `module` | `"es2020"` (línea 19) | `"preserve"` | Cambiar |
| `moduleResolution` | `"bundler"` (línea 15) | *omitido* | Quitar (redundante: `preserve` implica resolución bundler) |
| `isolatedModules` | *ausente* | `true` | Añadir |
| `useDefineForClassFields` | `false` (línea 20) | *omitido* (default `true`) | **D1**: probar `true`, keep-if-green |

Notas técnicas:

- `module: "preserve"` requiere TS ≥ 5.4; el repo está en **TypeScript 6.0.3** (peer de
  `@angular/compiler-cli@22.2.3`: `>=6.0 <6.1`) ⇒ soportado.
- `isolatedModules: true` exige que cada fichero se sostenga solo al transpilar. Hazards clásicos:
  (a) `const enum` reexportados/ambient importados desde otro módulo, (b) re-exports de tipos sin
  `export type`. Ambos ya quedaron implícitamente verificados: la auditoría de #81 corrió el build
  completo con la opción puesta.
- `tsconfig.app.json` y `tsconfig.spec.json` `extends` del raíz y no declaran ninguna de estas
  opciones ⇒ el cambio les llega por herencia; no hay que tocarlos.

## 2. Decisiones (registradas con el usuario)

**D1 — `useDefineForClassFields`**: **resuelta → `true`** (línea borrada, se hereda el default del
scaffold). Verificado: `grep -rn "extends [A-Z]" src/` → **0 herencias de clase** ⇒ riesgo semántico
mínimo. Build ✅ 1.56 MB y test ✅ 24/135 con la opción activa. *Queda el smoke manual de F5 para
confirmar el comportamiento en runtime.*

**D2 — opcionales del strict**: **resuelta → ambos**.
- `noImplicitOverride: true` → **0 errores** (como se previó: no hay `extends` de clase en `src/`).
- `noPropertyAccessFromIndexSignature: true` → **13 errores TS4111**, todos de acceso por punto sobre
  un index signature, arreglados con acceso por corchetes (triviales, keep-if-green cumplido):
  - `recipe-card-form.component.ts` (10): `form!: FormGroup` sin genérico ⇒ `controls` indexado.
    Cambiado `this.form.controls.title` → `this.form.controls['title']` (líneas 142, 143, 150, 151,
    257, 258, 259, 261, 265, 270).
  - `toolbar.component.ts` (3): `route.snapshot.firstChild?.data` ⇒ `data?.title` →
    `data?.['title']` (líneas 122-124).

**D3 — `const enum`**: **resuelta → `enum` normal**. `recipe.service.ts:33`: quitado `const`. Sus 8
usos (líneas 69, 95, 113, 142, 173, 192, 218) siguen igual y el build pasa. Alternativa `as const`
descartada por cambiar el estilo del fichero.

## 3. Fases

### 3.1 F1 — Cambio mínimo alineado con el scaffold

En `tsconfig.json`:

1. `"module": "preserve"` (sustituye `"es2020"`).
2. Añadir `"isolatedModules": true`.
3. Borrar `"moduleResolution": "bundler"`.

Verificar `yarn build` y `yarn test --watch=false` tras el cambio (esperado verde: ya probado en la
auditoría de #81).

### 3.2 F2 — `useDefineForClassFields`

- Cambiar `false` → `true` (o directamente borrar la línea para heredar el default, como hace el
  scaffold; se recomienda **borrar la línea** para no divergir del scaffold).
- Verificar build/test/lint; el juicio definitivo lo da el smoke manual de F5 (formularios
  reactivos y `file-input` son los componentes con más campos de clase).

### 3.3 F3 — Opcionales del strict

- Añadir `"noImplicitOverride": true` (esperado 0 cambios: no hay `extends` de clase en `src/`;
  las clases implementan interfaces, que no requieren `override`).
- Añadir `"noPropertyAccessFromIndexSignature": true` y arreglar lo que salga (acceso por
  corchetes). Keep-if-green según D2.

### 3.4 F4 — `const enum DatabaseCollectionsNames` (`recipe.service.ts:33`)

Situación verificada: es el **único** `const enum` del repo y sus 8 usos (líneas 69, 95, 113, 142,
173, 192, 218) son **same-file** ⇒ hoy no rompe con `isolatedModules` (TS ≥ 5 emite los `const enum`
locales como objeto). Pero el día que se importe en otro fichero el build fallará. Acción de 1 línea:
**quitar `const`** para dejarlo `enum` normal (semántica idéntica para el consumidor; alternativa
descartada `as const` por cambiar el estilo del fichero).

### 3.5 F5 — Verificación global

1. `yarn build` ✅ (< 2 MB; comparar `Initial total` con el baseline de F0).
2. `yarn test --watch=false` ✅ 24 ficheros / 135 tests.
3. `npm run lint` ✅ 0 errores (los 14 warnings de OnPush siguen aceptados, #83).
4. Smoke manual (la app corre contra el proyecto Firebase de test vía `npm start`):
   - arranque + login/logout con `test@mail.com`,
   - CRUD de recetas (crear, editar, borrar con diálogo),
   - subida/borrado de imagen (Storage),
   - **`file-input` escribiendo en el form** y validación `required` (el componente más sensible a
     F2 por su cantidad de campos de clase),
   - filtro por categorías y búsqueda.
5. Actualizar la tabla §0 y cerrar la issue #85 con comentario de resultado.

## 4. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| F2 (`useDefineForClassFields`) altera inicialización de campos de clase de forma sutil | 0 herencias en `src/` reduce el riesgo a nulo; smoke manual de formularios/file-input; rollback a `false` documentado en D1 |
| `isolatedModules` rompe un `const enum` o re-export futuro | Único `const enum` del repo migrado en F4; build completo ya lo validó en la auditoría de #81 |
| `noPropertyAccessFromIndexSignature` ensucia el diff | Keep-if-green (D2): si no es trivial, se quita y se deja pendiente en la issue |
| Regresión de comportamiento no cubierta por tests unitarios | Suite completa (135 tests) + smoke manual; el CI (yarn, Node 22) repetirá build/test en la PR |

## 5. Criterios de aceptación

- [x] `tsconfig.json` con `module: "preserve"`, `isolatedModules: true` y **sin** `moduleResolution`.
- [x] D1 resuelta: `useDefineForClassFields` en `true` (línea borrada).
- [x] D2 resuelta: ambos opcionales añadidos (13 TS4111 arreglados, triviales).
- [x] `const enum` → `enum` normal en `recipe.service.ts`.
- [x] `yarn build` ✅ (1.56 MB) · `yarn test --watch=false` ✅ 24/135 · `npm run lint` ✅ 0 errores.
- [ ] Smoke manual OK (incluido `file-input` + formularios) — **pendiente del usuario**.
- [x] Plan §0 actualizado; issue #85 cerrada/actualizada con el resultado (al mergear).

## 6. Fuera de alcance

- `experimentalDecorators`, `target: ES2022`, `types: ["vitest/globals"]`, `paths`, `strict` y los
  `angularCompilerOptions`: **no se tocan** (forman parte del scaffold y no los cubre la issue).
- Migración OnPush (#83), signal inputs en `file-input` (#86), firebase v13 (#84): issues aparte.

## 7. Verificado previamente (no hace falta repetir)

- La auditoría de #81 aplicó `module: "preserve"` + `isolatedModules: true` de forma **temporal**:
  `ng build` ✅ (5.79 s / 1.54 MB) y `npx ng test --watch=false` ✅ 24/135, después revertido con
  árbol limpio (`git status`).
- `recipe.service.ts` es el único fichero con `const enum`, usos todos same-file.
- Sin herencias de clase en `src/` (`extends [A-Z]` → 0 hits).
