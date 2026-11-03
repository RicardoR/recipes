# Plan — Issue #86: `file-input` — completar la migración a signal inputs (5 `@Input()` legacy)

> Objetivo: dejar `grep -r "@Input" src/` en **0 hits** convirtiendo los 5 inputs legacy de
> `FileInputComponent` (`id`, `placeholder`, `required`, `disabled`, `value`) a `input()`/`model()`,
> **sin romper el contrato `MatFormFieldControl`** de Material 22 ni el `ControlValueAccessor`, y
> con build/test/lint verdes + smoke manual al final.

Repo: `RicardoR/recipes` · Issue: https://github.com/RicardoR/recipes/issues/86

---

## 0. Progreso de la implementación

Rama: `86-file-input-signal-inputs` (creada desde `master`)

| Fase | Tarea | Estado | Notas |
|---|---|---|---|
| **F0** | Baseline verde antes de tocar nada | ✅ | `yarn build` ✅ 1.56 MB · `yarn test --watch=false` ✅ 24 ficheros / 135 tests · `npm run lint` ✅ 0 errores y **0 warnings** (los 14 de OnPush ya no existen: cerrados en #83) |
| **F1** | `placeholder` + `required` → `input()` (conversión directa) | ✅ | Material **no lee** `placeholder`; `required` se desempaqueta con `_unwrapMaybeSignal` → señal OK. Template actualizado a `placeholder()` / `required()`. Ver §3.1 |
| **F2** | `id` → campo plano (sin input) | ✅ | Material lee `_control.id` **en crudo** y la interfaz lo tipa como `string` ⇒ no puede ser señal. **D1** (revisada: antes alias + getter, descartado por `no-input-rename`). Sin excepciones de lint. Ver §3.2 |
| **F3** | `value` + `disabled` → `model()`; CVA escribe con `.set()` | ✅ | `writeValue` (133), `setDisabledState` (147), `handleFiles` (173). **D2**. `import {Input}` eliminado. Ver §3.3 |
| **F4** | Template + spec: llamadas `()`, tests nuevos de aceptación | ✅ | Spec focalizado ✅ **19 tests** (15 + 4 nuevos: `placeholder`→`stateChanges`, `errorStateMatcher`→`stateChanges`, `attr.id` generado, `value()` tras `handleFiles`) |
| **F5** | Verificación global (grep, build, test, lint) + smoke manual | 🟡 | `grep "@Input"` → **0** · `yarn build` ✅ 1.57 MB (baseline 1.56) · `yarn test --watch=false` ✅ 24 ficheros / **139 tests** · `npm run lint` ✅ 0 errores / 0 warnings. **Smoke manual: pendiente del usuario** |
| **F6** | Plan §0 + issue #86 cerrada/actualizada con el resultado | ⬜ | Al mergear |

---

## 1. Contexto — estado actual

`src/app/shared/components/file-input/file-input.component.ts` mezcla dos estilos (líneas 62-73):

| Legacy (`@Input()`, líneas 62-66) | Signals (líneas 68-73) |
|---|---|
| `id`, `placeholder`, `required` (`booleanAttribute`), `disabled` (`booleanAttribute`), `value` | `accept`, `multiple`, `readonly`, `color`, `separator`, `errorStateMatcher` |

Resto de hechos verificados:

- **Uso en el repo**: solo `recipe-card-form.component.html:40-44`, con `accept` y `placeholder`
  estáticos y `formControlName="photo"`. **No se enlaza** `[id]`, `[value]` ni `[disabled]` desde
  ningún padre (grep en `src/**/*.html`: sin resultados para `app-file-input`).
- **`@Output()`**: 0 en todo `src/` → con #86 termina la recorrido signal-ize de inputs/outputs.
- `grep -r "@Input" src/` → **5 hits**, todos en este fichero.

### 1.1 Qué acepta de verdad `MatFormFieldControl` en Material 22 (leído de `node_modules`)

Interfaz: `@angular/material/types/_form-field-control-chunk.d.ts`. Consumo real en
`fesm2022/_form-field-chunk.mjs`:

| Propiedad | Cómo la lee `MatFormField` | ¿Admite signal? |
|---|---|---|
| `errorState`, `disabled`, `required`, `autofilled`, `focused`, `shouldLabelFloat` | `_unwrapMaybeSignal(_control.x)` → `isSignal(v) ? v() : v` | ✅ **sí** |
| `id` | `_control.id` **en crudo** (`[attr.for]="_control.disableAutomaticLabeling ? null : _control.id"`) | ❌ debe seguir siendo `string` |
| `placeholder`, `value` | **no se leen en ningún sitio** (`grep "_control\.\(placeholder\|value\)"` → 0) | ✅ sin restricción |
| `stateChanges` | opcional: *"Not necessary if the control is signal-based"* | — |

> Esto **corrige parcialmente el punto 3 de la issue**: solo `id` exige un `string` plano (ver D1).
> `placeholder` y `value` no los toca Material, y `disabled`/`required` ya van envueltos en
> `_unwrapMaybeSignal`.

### 1.2 `ngOnChanges` sí se dispara con inputs signal (corrige el punto 1 de la issue)

La issue asume que `ngOnChanges` solo corre para inputs legacy y pide un `effect()` que emita
`stateChanges`. Verificado en el código fuente de Angular 22:

1. `@angular/compiler` `compiler.mjs:24335-24337`: si la clase tiene `ngOnChanges`
   (`meta.lifecycle.usesOnChanges`) → `features.push(ɵɵNgOnChangesFeature)`.
2. `@angular/core` `_debug_node-chunk.mjs:93-98`: ese feature instala
   `definition.setInput = ngOnChangesSetInput`.
3. `_debug_node-chunk.mjs:5479`: el setter de inputs llama
   `def.setInput(instance, inputSignalNode, value, publicName, privateName)` **también** para
   `InputFlags.SignalBased` (y `ngOnChangesSetInput`, línea 115-127, recorre ese
   `inputSignalNode`).

**Evidencia empírica (F0)**: el test existente `should notify the form field when an input changes`
cambia `accept` —ya signal input— y espera `stateChanges` emitido. Está en verde con la suite
completa (135/135). Si al ejecutar F4 el test nuevo no pasa, fallback documentado en §4.

→ **D3: se mantiene `ngOnChanges()` tal cual; no se añade `effect()`.**

### 1.3 `strictInputAccessModifiers` del repo (ya no aplica a D1)

`tsconfig.json:29` tiene `"strictInputAccessModifiers": true` → `honorAccessModifiersForInputBindings: true`
(`compiler-cli/bundles/chunk-CG2JHXR3.js:4749-4750`). Con esa flag, el type-check de plantillas
asigna `dirId.<campoDelInput>` para los inputs enlazados (`compiler.mjs:30204-30206`) ⇒ **el campo
de un input no puede ser `private`**. Era el motivo por el que la primera versión de D1 usaba un
campo público; con la D1 revisada (`id` deja de ser input) la restricción **no afecta a este
componente**, pero se documenta por si se reintroduce algún input con alias.

## 2. Decisiones (registradas con el usuario)

**D1 — `id` → campo plano, sin input** (elegido, tras valorar alternativas).

Material lee `_control.id` **en crudo** para el `[attr.for]` de la label y la interfaz
`MatFormFieldControl` lo tipa como `readonly id: string`, así que `id` no puede ser una señal:

```ts
readonly id = `app-file-input-${nextUniqueId++}`;
```

Es un valor constante por instancia (no hay nada reactivo que exponer), así que en lugar de
sostenerlo como input se **elimina el binding `[id]`**: nadie lo enlaza en el repo (§1) y el
`attr.id` del display input sigue funcionando con el valor generado (cubierto por test).

Alternativas valoradas y descartadas:

| Alternativa | Por qué no |
|---|---|
| `input()` + `alias: 'id'` + `get id()` | Funciona, pero exige una excepción a `@angular-eslint/no-input-rename` (disable inline o `allowedNames: ['id']` en `eslint.config.js`) para conservar un binding sin uso |
| `inputs: ['id']` en la metadata de `@Component` | Evitaría el rename, pero `@angular-eslint/no-inputs-metadata-property` está en **error** (verificado con `eslint --print-config`) |
| Signal `id` + `disableAutomaticLabeling: true` sin `implements MatFormFieldControl` | Pierde el chequeo de tipos de todo el contrato con Material **y** el `for` de la label (a11y) |
| Mantener `@Input() id` | Incumple el criterio `grep -r "@Input" src/` → 0 |

**D2 — `value` y `disabled` → `model()`** (elegido).

```ts
readonly disabled = model(false);
readonly value = model<FileOrArrayFile | null>(null);
```

Ambos se escriben *dentro* del componente (`writeValue` línea 121, `setDisabledState` 135,
`handleFiles` 162) y Material los desempaqueta bien (`disabled` con `_unwrapMaybeSignal`; `value`
no se lee). `model()` los mantiene como inputs → **API intacta** (`[disabled]`, `[value]`,
`[(value)]` funcionarían si algún padre los enlazara) y el componente puede escribirlos con `.set()`.
Descartada `signal()` + getter: deja de ser input y `[disabled]` dejaría de compilar en un padre.

**D3 — mantener `ngOnChanges`, sin `effect()`** (elegido). Ver §1.2: la premisa de la issue no se
sostiene y el `effect()` redundaría con `ngOnChanges` (doble emisión de `stateChanges`).

**D4 — `placeholder` y `required` → conversión directa** (sin alternativa: es lo que pide la issue
y §1.1 lo permite).

## 3. Fases

### 3.1 F1 — `placeholder` y `required`

```ts
readonly placeholder = input('Choose a file');
readonly required = input(false, {transform: booleanAttribute});
```

Quitar `Input` del `import` de `@angular/core` solo cuando ya no quede ningún uso (F3).

### 3.2 F2 — `id` (D1)

Sustituir `@Input() id = ...` por un campo plano:

```ts
readonly id = `app-file-input-${nextUniqueId++}`;
```

Sin input, sin getter y sin alias ⇒ **cero excepciones de lint**. El template (`[attr.id]="id"`) y
Material (`[attr.for]`) leen la misma propiedad, así que **no cambia nada** en el template ni en
`mat-form-field`. `id` deja de ser enlazable desde un padre (API perdida, sin uso en el repo).

### 3.3 F3 — `value` y `disabled` (D2)

| Sitio | Hoy | Después |
|---|---|---|
| Declaración | `@Input() ... disabled = false` / `@Input() ... value = null` | `model(false)` / `model<FileOrArrayFile \| null>(null)` |
| `writeValue` (121-125) | `this.value = value` | `this.value.set(value)` |
| `setDisabledState` (135-139) | `this.disabled = isDisabled` | `this.disabled.set(isDisabled)` |
| `handleFiles` (162) | `this.value = value` | `this.value.set(value)` |

Al final: `grep -r "@Input" src/` → 0 hits y `import {Input}` fuera del componente.

### 3.4 F4 — Template y spec

`file-input.component.html` (4 llamadas a señales):

- `[attr.placeholder]="placeholder"` → `placeholder()`
- `[disabled]="disabled"` (líneas 7 y 22) → `disabled()`
- `[required]="required"` → `required()` · `[attr.aria-required]="required"` → `required()`
- `[attr.id]="id"` **no se toca** (ya es un campo plano, no un getter).

`file-input.component.spec.ts`:

- `component.disabled` → `component.disabled()` (línea 131) · `component.required` →
  `component.required()` (líneas 172, 177).
- **Tests nuevos (criterio de aceptación de la issue)**:
  1. cambiar `placeholder` desde el host → `stateChanges` emite,
  2. cambiar `errorStateMatcher` desde el host → `stateChanges` emite (hoy solo está cubierto
     `accept`),
  3. `attr.id` del display input refleja el id generado (`app-file-input-N`) — bloquea D1,
  4. `component.value()` refleja el fichero tras `handleFiles` (bloquea D2).

### 3.5 F5 — Verificación global

1. `grep -r "@Input" src/` → **0 hits** · `grep -rn "ChangeDetectionStrategy.Eager"` → 0.
2. `yarn build` ✅ (< 2 MB; comparar `Initial total` con el baseline 1.56 MB de F0).
3. `yarn test --watch=false` ✅ 24 ficheros / 139 tests (135 baseline + 4 nuevos de F4).
4. `npm run lint` ✅ 0 errores / 0 warnings.
5. Smoke manual (app real, `npm start` contra el proyecto de test):
   - login con `test@mail.com`,
   - crear/editar receta y subir imagen → `file-input`:
     * preview + nombre en el display input,
     * **validación `required`**: borrar el campo `photo` y comprobar que el botón
       `[disabled]="pictureForm.invalid || submitted()"` se deshabilita y el error pinta con el
       matcher correcto,
     * **campo deshabilitado desde el form** (`setDisabledState`): editar una receta con imagen ya
       guardada / deshabilitar el form ⇒ botón de browse y display input en gris, sin clickeables,
     * cambiar de categoría y volver ⇒ el estado del campo no se pierde,
   - borrar la receta ⇒ `deleteImage` ignora `DEFAULT_IMAGE` (`recipe.service.ts:267`).
6. Actualizar §0 y cerrar la issue #86 con comentario de resultado (al mergear).

### 3.6 F6 — Cierre

Plan §0 actualizado · PR · issue #86 cerrada con el resultado.

## 4. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `ngOnChanges` **no** emite al cambiar un input signal en el test nuevo (premisa de la issue) | Fallback: añadir el `effect()` de la issue (leer los inputs convertidos → `stateChanges.next()`). Se detecta en F4, antes del smoke |
| `model()` en `value`/`disabled` cambia semántica si un padre los enlaza | Nadie los enlaza hoy (§1); si se enlazara, `[x]` sigue funcionando y `.set()` interno emite `xChange` sin oyentes |
| `id` deja de ser input: un padre que enlazara `[id]` dejaría de compilar | Sin usos en el repo (§1); el test F4.3 cubre que `attr.id` sigue pintando el id generado; el `[attr.for]` de Material sigue apuntando a él |
| Regresión de comportamiento no cubierta por unitarios (`setDisabledState`, CVA) | Suite completa + checklist de smoke de F5 (los 3 escenarios marcados en negrita) |

## 5. Criterios de aceptación

- [x] `grep -r "@Input" src/` → **0 hits** (los 5 migrados).
- [x] `stateChanges.next()` emite cuando cambia cualquier input: tests F4.1 y F4.2
      (`placeholder` y `errorStateMatcher` desde el host).
- [x] `id` es campo plano (sin input ni excepción de lint): `attr.id` pinta el id generado y el
      `[attr.for]` de Material sigue asociando la label (test F4.3) — D1. **`[id]` deja de ser
      enlazable** (sin uso en el repo).
- [x] `value` observable vía `component.value()` tras `handleFiles` (test F4.4) — D2.
- [x] `yarn build` ✅ (1.57 MB) · `yarn test --watch=false` ✅ 24/139 · `npm run lint` ✅ 0 errores /
      0 warnings.
- [ ] Smoke manual F5 OK (campo deshabilitado desde el form, selección de fichero escribe `value`,
      validación `required` pinta el error con el matcher correcto) — **pendiente del usuario**.
- [ ] Plan §0 actualizado; issue #86 cerrada/actualizada con el resultado (al mergear).

## 6. Fuera de alcance

- `ngOnChanges`/`ngDoCheck`/`ngOnDestroy` **se quedan**: son el patrón canónico de
  `MatFormFieldControl` + `ErrorStateMatcher.isErrorState` (recalcular en cada check).
- `errorState`, `focused`, `empty`, `shouldLabelFloat`, `controlType`, `stateChanges`: **no se
  tocan** — no son inputs.
- Los 6 inputs signal ya existentes (`accept`, `multiple`, `readonly`, `color`, `separator`,
  `errorStateMatcher`): ya migrados, sin cambios.
- **`id` deja de ser input (D1)**: `[id]` ya no se puede enlazable desde un padre. Es el único
  cambio de API de la issue; el resto (`[placeholder]`, `[required]`, `[disabled]`, `[value]`)
  siguen funcionando igual.
- `#87` (bug upstream de zone.js) y `#84` (firebase 13): issues aparte.
- Añadir lint al CI (hoy `node.js.yml` no corre lint): decisión aparte.

## 7. Verificado previamente (no hace falta repetir)

- Inventario de §1: 5 `@Input()`, todos en `file-input.component.ts:62-66`; 0 `@Output()` en `src/`.
- Contrato de Material 22 leído de `node_modules` (§1.1): `_unwrapMaybeSignal` en
  `errorState/disabled/required/autofilled/focused/shouldLabelFloat`; `id` en crudo; `placeholder`
  y `value` sin lector.
- `ngOnChanges` con inputs signal (§1.2): 3 puntos de anclaje en el código fuente + test existente
  en verde en F0.
- `strictInputAccessModifiers: true` → `honorAccessModifiersForInputBindings` (§1.3).
- F0 (baseline): `yarn build` ✅ 1.56 MB · `yarn test --watch=false` ✅ 24/135 · `npm run lint` ✅
  0 errores / 0 warnings.
