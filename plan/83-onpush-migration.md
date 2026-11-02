# Plan — Issue #83: Migrar los 14 componentes `Eager` → OnPush y subir la regla de lint a `error`

> Objetivo: eliminar los 14 warnings de `@angular-eslint/prefer-on-push-component-change-detection`
> (12 componentes + 2 test-hosts con `ChangeDetectionStrategy.Eager`, heredados del schematic
> `change-detection-eager` de #81), migrarlos a `OnPush` y subir la regla a `"error"`
> (`eslint.config.js:33`). Ejecución **incremental por tiers** (riesgo creciente), con
> build/test/lint verdes tras cada fase. Estrategia en Tier 3: **signals** para todo el estado
> mutable leído por el template (D1).

Repo: `RicardoR/recipes` · Issue: https://github.com/RicardoR/recipes/issues/83

---

## 0. Progreso de la implementación

Rama: `83-onpush-migration` (creada desde `master`)

| Fase | Tarea | Estado | Notas |
|---|---|---|---|
| **F0** | Baseline verde antes de tocar nada | ✅ | `yarn build` ✅ 1.56 MB · `yarn test --watch=false` ✅ 24 ficheros / 135 tests · `npm run lint` ✅ 0 errores / **14 warnings** OnPush |
| **F1** | Tier 1 — solo flip (5 warnings) | ✅ | `AppComponent`, `DeleteRecipeDialogComponent`, `RecipeLayoutComponent` + los 2 test-hosts de `file-input.component.spec.ts:25,48`. Lint → **9 warnings** (14−5; §3.2 decía 10 por contar los 2 test-hosts como uno) |
| **F2** | Tier 2 — flip + 1 signal (3 warnings) | ✅ | `LoginComponent` y `NewRecipeComponent`: flip sin cambios. `RecipeListComponent`: `categories` → signal + template + spec. Lint → **6 warnings** |
| **F3** | Tier 3 feature — signals (4 warnings) | ✅ | `EditRecipeComponent`, `MyRecipesComponent`, `PublicRecipeListComponent` (signals) + `RecipeDetailsComponent` (flip solo). Specs actualizados (`campo()`). Lint → **2 warnings** |
| **F4** | Tier 3 shared — signals + `markForCheck` (2 warnings) | ✅ | `RecipeCardFormComponent` (signals: `recipeImage`, `submitted`, `categories`, `editingMode`, `isOwnRecipe`) y `FileInputComponent` (`markForCheck` en CVA + suscripción `statusChanges` en `ngDoCheck`, ver §3.5). **Los 3 tests DOM de file-input verdes**. Lint → **0 warnings** |
| **F5** | Regla a `"error"` + verificación global | ✅ | `eslint.config.js:33` → `"error"`; **0 errores / 0 warnings**, 24/135, build 1.56 MB (< 2 MB), `grep Eager` → 0 hits |
| **F6** | Smoke manual Tier 3 + cierre de issue | ✅ | Smoke OK, sin errores de consola (§3.7); plan B de F3 no hizo falta. Commits hechos por fase. Pendiente: push + PR + cierre de issue al mergear |

## 1. Contexto — inventario verificado

`npm run lint` hoy (verificado): **0 errores / 14 warnings** (coincide con la issue). Inventario por
tier (líneas confirmadas en `master`):

| Tier | Componente | Fichero:línea | Asignaciones `this.` | Streams | Trabajo |
|---|---|---|---|---|---|
| **1** | `AppComponent` | `src/app/app.component.ts:11` | 0 | 0 | Solo flip |
| **1** | `DeleteRecipeDialogComponent` | `delete-recipe-dialog.component.ts:10` | 0 | 0 | Solo flip |
| **1** | `RecipeLayoutComponent` | `recipe-layout.component.ts:12` | 0 | 0 | Solo flip |
| **1** | test-host ×2 | `file-input.component.spec.ts:25,48` | — | — | Solo flip (plantillas triviales, inputs ya son signals) |
| **2** | `LoginComponent` | `login.component.ts:22` | 1 (`passWordHidden`) | 0 | Flip (mutación en evento de template → seguro bajo OnPush) |
| **2** | `NewRecipeComponent` | `new-recipe.component.ts:18` | 0 | 1 (solo navega) | Flip |
| **2** | `RecipeListComponent` | `recipe-list.component.ts:23` | 1 (`categories`) | 3 | Flip + `categories` → signal |
| **3** | `EditRecipeComponent` | `edit-recipe.component.ts:21` | 3 (`recipeDetails`, `isSending`) | 2 | Signals |
| **3** | `MyRecipesComponent` | `my-recipes.component.ts:24` | 7 | 2 | Signals |
| **3** | `PublicRecipeListComponent` | `public-recipe-list.component.ts:24` | 10 | 4 | Signals |
| **3** | `RecipeDetailsComponent` | `recipe-details.component.ts:28` | 3 | 2 | Flip + revisión (ver §3.3) |
| **3** | `FileInputComponent` | `file-input.component.ts:37` | 7 | 0 | Flip + `markForCheck` + `statusChanges` (ver §3.4) |
| **3** | `RecipeCardFormComponent` | `recipe-card-form.component.ts:68` | 12 | 4 | Signals (ver §3.4) |

3 componentes ya son OnPush: `toolbar`, `recipe-ribbon`, `recipes-multiple-select`. No hay ningún
`@Output()` en `src/` (0 hits). Specs que leen campos afectados (churn previsto en F3/F4):
`my-recipes`, `public-recipe-list`, `edit-recipe`, `recipe-card-form`, `recipe-list`, `file-input`
(único spec con aserciones DOM: `querySelector` sobre botón/iconos/display-input).

## 2. Decisiones (registradas con el usuario)

**D1 — estrategia Tier 3 → `signals`**: convertir a signal **todo el estado mutable leído por el
template** (`recipesFiltered`, `userId`, `recipeDetails`, `isSending`, `recipeImage`, `submitted`,
`categories`, `editingMode`, `isOwnRecipe`, …). Motivos: (a) lo recomienda la issue, (b) los
`effect()` de constructores (`my-recipes`, `public-recipe-list`, `recipe-card-form`) escribiendo
campos *plain* bajo OnPush **no marcan la vista** → con signals el write marca el consumer y el
template se re-renderiza solo, (c) callbacks de suscripción async no necesitan `markForCheck`
manual. Descartada la opción `markForCheck` en cada callback: menos churn en specs pero frágil
(obligación de acordarse en cada callback nuevo) y no arregla el problema de los effects.
*Los campos que no se leen en template (`recipesRetrieved`, `imageRoute`, `fileToUpload`,
`recipeDetails` privado de `recipe-details`) se quedan plain.*

**D2 — alcance → solo #83**: #86 (migrar los 5 `@Input()` legacy de `file-input` a
`input()`/`model()`) queda **fuera**. `file-input` se toca en F4 solo lo necesario para OnPush
(`markForCheck` + `statusChanges`), conservando `ngOnChanges`/`ngDoCheck` (contrato
`MatFormFieldControl`) y los `@Input()` legacy. La decisión de semántica de `value`/`disabled`
(`model()` vs separar input de estado) sigue abierta en #86.

**D3 — `changeDetection` explícito, no eliminarlo (decidido durante F1)**: en Angular 22 OnPush
*es* el default (`NOTE: OnPush is enabled by default` en el enum; la propia regla ofrece quitar la
propiedad), así que `changeDetection: ChangeDetectionStrategy.OnPush` es técnicamente redundante.
Se decidió **mantenerlo explícito** en los 14 sitios por consistencia con los 3 componentes que ya
lo declaraban (`toolbar`, `recipe-ribbon`, `recipes-multiple-select`) y con el enunciado de la
issue. La regla lo permite (`allowExplicitOnPush: true` por defecto).

## 3. Fases

### 3.1 F0 — Baseline

Crear rama `83-onpush-migration` desde `master` y registrar cifras:

```bash
yarn build                      # esperado < 2 MB
yarn test --watch=false         # esperado 24 ficheros / 135 tests
npm run lint                    # esperado 0 errores / 14 warnings
```

### 3.2 F1 — Tier 1: solo flip (4 warnings)

Cambiar `ChangeDetectionStrategy.Eager` → `ChangeDetectionStrategy.OnPush` en:

1. `src/app/app.component.ts:11`
2. `src/app/features/recipes/components/delete-recipe-dialog/delete-recipe-dialog.component.ts:10`
3. `src/app/features/recipes/components/recipe-layout/recipe-layout.component.ts:12`
4. `src/app/shared/components/file-input/file-input.component.spec.ts:25` y `:48` (los 2
   test-hosts; sus inputs ya son signals → se marcan dirty solos)

Verificar build/test/lint (esperado: 10 warnings restantes).

### 3.3 F2 — Tier 2: flip + 1 signal (3 warnings)

- **`login.component.ts:22`** — flip. Justificación: `passWordHidden` solo se escribe en el handler
  `(click)` del propio template (evento → markForCheck implícito); `form` se construye en
  `ngOnInit` (antes del primer render). Sin más cambios.
- **`new-recipe.component.ts:18`** — flip. La única suscripción (`createRecipe`) solo navega;
  no muta estado de vista.
- **`recipe-list.component.ts:23`** — flip + `categories: ElementModel[] = []` →
  `readonly categories = signal<ElementModel[]>([])`:
  - se asigna en `getCategories()` (subscribe async, sin origen en el template) → bajo OnPush la
    vista quedaría stale sin signal,
  - template `recipe-list.component.html:5`: `[options]="categories"` → `[options]="categories()"`,
  - spec `recipe-list.component.spec.ts:50`: `component.categories` → `component.categories()`.
  - `recipesFiltered` ya es signal ✓; `categoryFilter.valueChanges` → `filterRecipes` escribe el
    signal ✓; el `effect(() => this.recipesFiltered.set(this.recipes()))` escribe un signal ✓.

Verificar build/test/lint (esperado: 7 warnings restantes).

### 3.4 F3 — Tier 3 feature: signals (4 warnings)

**`edit-recipe.component.ts:21`**:
- `recipeDetails!: Recipe` → `readonly recipeDetails = signal<Recipe | undefined>(undefined)`
  (se asigna en subscribe async de `getRecipeDetails` y se lee en template
  `[recipeDetails]="recipeDetails"` → `recipeDetails()`).
- `isSending = false` → `readonly isSending = signal(false)` (se pone a `false` en el callback async
  de `updateRecipe`; el `true` inicial es en el handler, pero el `false` posterior es async →
  sin signal el botón quedaría deshabilitado para siempre).
- Usos internos: `this.recipeDetails.imgSrc` → `this.recipeDetails()!.imgSrc` (y análogos en
  `goToRecipe`/`updateRecipe`); template `edit-recipe.component.html:4-5` → `isSending()`,
  `recipeDetails()`.
- Spec `edit-recipe.component.spec.ts:55,67,73,75,83`: `component.recipeDetails` →
  `component.recipeDetails()`.

**`my-recipes.component.ts:24`** y **`public-recipe-list.component.ts:24`** (mismo patrón):
- `recipesFiltered: Recipe[] = []` → `readonly recipesFiltered = signal<Recipe[]>([])`
  (asignado en 2-3 subscripciones async + `onSearchText`; el `effect()` de constructor lee
  `toolbarService.searchTerm()` y escribe vía `onSearchText` → con signal el write marca la vista).
- `userId?: string` → `readonly userId = signal<string | undefined>(undefined)` (se pone a
  `undefined` en el tap de `listenToLogoutChanges` — async, sin evento de template).
- `recipesRetrieved` se queda **plain** (solo se lee dentro de `onSearchText`, no en template).
- Templates: `[recipes]="recipesFiltered()"`, `[userId]="userId()"`.
- Specs: `my-recipes.component.spec.ts:67,71` y `public-recipe-list.component.spec.ts:72,76` →
  lecturas con `()`.

**`recipe-details.component.ts:28`** — flip + revisión (el más barato del Tier 3):
- `recipeDetails$ | async` → el `async pipe` llama `markForCheck()` en cada emisión, y el `tap`
  (que escribe `isOwnRecipe`/`recipeDetails`) corre **aguas arriba** del pipe ⇒ la vista se marca
  dirty ya con los campos actualizados. `currentUserId` se escribe en `ngOnInit` (primer render).
- Por eso aquí **no hacen falta signals**: solo flip + smoke. Si el smoke detecta vista stale,
  convertir `isOwnRecipe`/`currentUserId` a signal (plan B documentado).

Verificar build/test/lint + specs actualizados (esperado: 3 warnings restantes).

### 3.5 F4 — Tier 3 shared: signals + `markForCheck` (2 warnings)

**`recipe-card-form.component.ts:68`** — signals para estado de vista (12 asignaciones, 4 streams):

| Campo | Por qué | Notas |
|---|---|---|
| `recipeImage` | se escribe en `FileReader.onload` (async, sin evento de template) | template `@if (recipeImage)` + `[src]` |
| `submitted` | se pone a `false` en el subscribe async de `postImage` | template `@if (submitted)` y `[disabled]` |
| `categories` | subscribe async de `getCategories()` | template `@if (categories && …)` → `categories()` |
| `editingMode`, `isOwnRecipe` | se escriben en `fillEditingData()` dentro de un `effect()` | effect + plain field = stale bajo OnPush |
| `isSending` | ya es signal ✓ | no tocar |

Se quedan **plain**: `imageRoute`, `fileToUpload`, `user` (en `initForm`, antes del primer render),
`form`/`pictureForm` (reactive forms; los updates de display van por CVA a DOM directo). Se
**conserva** `cdf.detectChanges()` en `deleteControl`/`addControl` (refresco forzado de la vista
propia para los FormArrays — funciona bajo OnPush: `detectChanges()` del ref propio fuerza el
refresh). `uploadProgress$ | async` ✓ no tocar. Spec `recipe-card-form.component.spec.ts:74,75,80,94,95`
→ lecturas con `()`.

**`file-input.component.ts:37`** — el caso duro (contrato `MatFormFieldControl` + CVA). Flip solo
**rompe 3 tests** del spec (es el único con aserciones DOM):

- *"should be disabled when the form control is disabled"*: `host.control.disable()` →
  `setDisabledState()` escribe `this.disabled` sin marcar la vista → el `[disabled]` del botón
  no se actualiza.
- *"should reflect the error state…"* / *"should use a custom error state matcher"*:
  `errorState` se calcula en `ngDoCheck`, que **no se ejecuta** si la vista OnPush no se refresca;
  `setErrors()` desde el spec no marca nada.

Acciones (conservando `ngOnChanges`/`ngDoCheck` y los 5 `@Input()` legacy — D2):

1. Inyectar `ChangeDetectorRef` y llamar `markForCheck()` en los callbacks CVA que escriben
   estado: `writeValue`, `setDisabledState`, `handleFiles` (+`updateDisplayedValue`), y
   `updateErrorState` cuando cambia `errorState`.
2. Suscripción a `ngControl.control.statusChanges` (con `takeUntilDestroyed`) que recalcule
   `updateErrorState()` + `markForCheck()`: bajo OnPush, cambios de estado externos (p. ej.
   `setErrors()` del padre) no llegan a `ngDoCheck` si nadie marca la vista. `ngDoCheck` se
   **conserva** como trigger adicional cuando la vista sí se refresca (patrón canónico de
   `MatFormFieldControl`; también cubre cambios del `errorStateMatcher` por input → el input
   change ya marca dirty).
3. `stateChanges.next()` sigue emitiendo en todos los mismos sitios (lo lee `MatFormField`).
4. Los 2 test-hosts ya quedaron en OnPush en F1; sus inputs son signals ⇒ se marcan dirty solos.

Verificar build/test/lint (esperado: **1 warning**, solo el de la regla en sí… no: los 14 warnings
son todos componentes; tras F1-F4 → **0 warnings** con la regla aún en `"warn"`).

### 3.6 F5 — Regla a `error` + verificación global

1. `eslint.config.js:33`: `"@angular-eslint/prefer-on-push-component-change-detection": "warn"` →
   `"error"`.
2. `yarn build` ✅ (< 2 MB; comparar `Initial total` con F0).
3. `yarn test --watch=false` ✅ 24 ficheros / 135 tests.
4. `npm run lint` ✅ **0 errores / 0 warnings**.
5. Actualizar tabla §0.

### 3.7 F6 — Smoke manual Tier 3 (la app corre contra el proyecto de test vía `npm start`)

Checklist (asincronía + estado mutable, que es lo que OnPush puede romper):

- [x] Arranque + login/logout con `test@mail.com`, recarga de página.
- [x] **Listados** (`my-recipes`, `public-recipe-list`): carga inicial de recetas, **búsqueda del
      toolbar** (effect → signal), **filtro por categorías** (el signal `categories` del
      `recipe-list`), borrado con diálogo → la lista se refresca.
- [x] **Detalles de receta**: cargar receta → botones Editar/Clonar/Borrar según `isOwnRecipe`
      (async pipe → markForCheck; plan B de F3 si falla).
- [x] **Formulario** (`new-recipe`/`edit-recipe`): prellenado en modo edición (`recipeDetails`
      signal), submit → snackbar + navegación (`isSending`), añadir/quitar pasos e ingredientes
      (FormArrays + `cdf.detectChanges()`), drag & drop.
- [x] **Imagen**: subir → preview (`recipeImage` signal) + progress bar (`submitted`), validación
      `required` + `imageValidator`, **campo deshabilitado desde el form** (`setDisabledState` +
      `markForCheck`), icono proyectado.
- [x] Login: toggle de visibilidad de contraseña (`passWordHidden`).

**Resultado (F6)**: ✅ todo OK, sin errores en consola. No hizo falta el plan B de F3
(`recipe-details` con solo flip se comporta bien gracias al `async pipe`).

## 4. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `file-input`: `ngDoCheck` no corre bajo OnPush si nadie marca la vista → `errorState`/`disabled` stale (rompe 3 tests + form real) | `markForCheck()` en callbacks CVA + suscripción a `statusChanges` (§3.5); los 3 tests del spec son la red de seguridad |
| `fixture.detectChanges()` solo fuerza la vista raíz del fixture (flag `RefreshView`); los hijos OnPush necesitan dirty o input cambiado | Foco en specs DOM (solo `file-input`); el resto de specs leen campos de instancia (insensibles a CD) |
| `effect()` de constructor escribiendo campos plain → stale bajo OnPush | Resuelto de paso por D1: todo lo que toca un effect pasa a signal |
| `recipe-details` (flip "barato") tenga vista stale en runtime pese al `async pipe` | Plan B documentado en F3: convertir `isOwnRecipe`/`currentUserId` a signal; lo dirá el smoke F6 |
| Churn de specs (~6 ficheros) | Pre-mapeado en §1: `my-recipes`, `public-recipe-list`, `edit-recipe`, `recipe-card-form`, `recipe-list`, `file-input` |
| Regresión no cubierta por unitarios | Suite 135 tests por fase + smoke F6; CI (yarn, Node 22) repetirá build/test en la PR (no lint — fuera de alcance) |

## 5. Criterios de aceptación

- [x] `npm run lint` → **0 errores y 0 warnings**.
- [x] `@angular-eslint/prefer-on-push-component-change-detection` en `"error"` (`eslint.config.js:33`).
- [x] `grep -rn "ChangeDetectionStrategy.Eager" src/` → **0 hits**.
- [x] `yarn test --watch=false` ✅ 24 ficheros / 135 tests.
- [x] `yarn build` ✅ (1.56 MB, igual que el baseline F0).
- [x] Smoke manual Tier 3 (checklist §3.7) — OK, sin errores en consola.
- [x] Plan §0 actualizado ✓ · issue #83 cerrada/actualizada con el resultado (al mergear — pendiente).

## 6. Fuera de alcance

- **#86** — migrar los 5 `@Input()` legacy de `file-input` a `input()`/`model()` (grep `@Input` →
  0) y la semántica `value`/`disabled` (D2). La issue sugiere misma pasada; se decidió no mezclar.
- **Añadir lint al CI** (hoy `node.js.yml` no corre lint) — decisión aparte.
- **#87** (bug upstream de zone.js) y **#84** (firebase 13): issues aparte.
- Conversión del resto de estado a signals donde no lo exige OnPush (p. ej. `toolbar.userId` ya
  funciona con eventos de template).

## 7. Verificado previamente (no hace falta repetir)

- Inventario de §1 verificado en `master`: 14 warnings exactos (`npm run lint`), líneas de cada
  componente confirmadas por grep (`ChangeDetectionStrategy.Eager` → 14 hits + 3 `OnPush`).
- No hay `@Output()` en `src/` (0 hits) ⇒ aquí termina el recorrido signal-ize de inputs/outputs.
- Specs con aserciones DOM localizados: solo `file-input.component.spec.ts` (3 tests en riesgo).
- La suite usa `overrideTemplate(Component, '')` en la mayoría de specs de componente ⇒ insensibles
  a cambios de CD; el churn es de lecturas de campos, no de DOM.
- Mecánica de CD de Ivy 22 leída en `node_modules/@angular/core`: `fixture.detectChanges()` fuerza
  la vista raíz (`RefreshView=1024`); hijos OnPush se refrescan solo con `Dirty`/`RefreshView`/
  consumer de signals dirty — base de los riesgos de §4.
