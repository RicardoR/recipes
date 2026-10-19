# Plan — Issue #73: sustituir `@ngxmc/file-input` por un componente propio

> Objetivo: eliminar la dependencia `@ngxmc/file-input` del proyecto `recipes`, sustituyéndola por un
> componente propio en `src/app/shared/components/file-input/` **estéticamente idéntico** al actual, y
> desbloquear la actualización de Angular (el bloqueo real son los *peer deps* `^20.0.0` de la librería).

Repo: `RicardoR/recipes` · Issue: https://github.com/RicardoR/recipes/issues/73
Upstream eliminado: https://github.com/GNURub/angular-material-components/tree/main/projects/file-input

---

## 0. Progreso de la implementación

Rama: `73-replace-ngxmcfile-input-component`

| Fase | Tarea | Estado | Notas |
|---|---|---|---|
| **F0** | Decisiones D1–D7 | ✅ | Cerradas con el usuario (§3) |
| **F0** | Rama + baseline | ✅ | Rama `73-replace-ngxmcfile-input-component` ya creada. Baseline: `lint` ✅ · `build` ✅ · `test` ✅ 23 ficheros / 120 tests |
| **F1/A** | Componente `app-file-input` (5 ficheros) | ✅ | `file-input.component.{ts,html,scss}`, `file-input-icon.directive.ts`, `file-input.types.ts` |
| **F1/A** | Spec del componente | ✅ | `file-input.component.spec.ts` — 12 tests ✅ |
| **F1/B** | SCSS global `_am-file-input.scss` | ✅ | Selector → `app-file-input` + aviso de que la regla sigue inerte a propósito (H4) |
| **F2/D** | Migración del consumidor | ✅ | `recipe-card-form.component.{ts,html}` |
| **F3/C** | `package.json` sin `@ngxmc/file-input` ni `overrides` | ✅ | |
| **F3/C** | Regenerar `package-lock.json` | ✅ | `npm install` sin conflictos ERESOLVE |
| **F3/C** | Borrar `yarn.lock` | ✅ | **Corrección:** `yarn.lock` estaba en `.gitignore` (línea 52) y **no estaba trackeado** ⇒ no hay cambio en el repo, sólo limpieza local |
| **F3/C** | CI: `npm ci` sin `--legacy-peer-deps` | ✅ | `.github/workflows/node.js.yml` |
| **F4/F** | `npm run lint` | ✅ | 0 errores |
| **F4/F** | `npm test` completo | ✅ | **24 ficheros / 132 tests** (baseline 23/120) |
| **F4/F** | `npm run build` (producción, budgets) | ✅ | Initial total 1.65 MB, sin warnings de budget |
| **F4/F** | `npm ci` en limpio sin `--legacy-peer-deps` | ✅ | 758 paquetes, sin ERESOLVE → **R-09 descartado** |
| **F4/F** | `npm ls @ngxmc/file-input` → vacío | ✅ | |
| **F4/F** | Comparación A/B del DOM con el componente original | ✅ | Ver §0.1 |
| **F4/F** | Comparación A/B del SCSS con el upstream | ✅ | Byte a byte idéntico |
| **F4/F** | Checklist visual §8.3 | ⏳ | **Pendiente**: requiere login en la app ( Firebase emulator / credenciales reales ) |

### 0.1 Evidencia de equivalencia estática (A/B contra `@ngxmc/file-input@20.1.0`)

Se reinstaló la librería original **fuera** del lockfile (`npm install --no-save --no-package-lock --legacy-peer-deps`)
para renderizar ambas versiones en el mismo test y comparar el DOM resultante. El test temporal se eliminó después.

| Aspecto | Original (`ngx-mat-file-input`) | Nuevo (`app-file-input`) | Resultado |
|---|---|---|---|
| Atributos del host | `accept`, `placeholder`, `class` | `accept`, `placeholder`, `class` | ✅ idéntico |
| Clase del host | `ngx-mat-file-input ng-untouched ng-pristine ng-valid` | `ngx-mat-file-input ng-untouched ng-pristine ng-valid` | ✅ idéntico |
| `id` del input | `ngx-mat-fileinput-0` | `ngx-mat-fileinput-0` | ✅ idéntico |
| Input visible | `class="mat-mdc-input-element mat-mdc-form-field-input-control mdc-text-field__input"` | idéntica | ✅ |
| Contenedor del sufijo | `<div class="mat-mdc-form-field-suffix">` | idéntico | ✅ |
| Botón | `matsuffix="" mat-icon-button="" class="mdc-icon-button mat-mdc-icon-button mat-mdc-button-base button-browse mat-primary"` | idéntico | ✅ |
| `mat-icon` proyectado | `class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color"` | idéntica | ✅ |
| Input oculto | `<input type="file" class="input-file" accept="image/*">` | idéntico | ✅ |
| `matSuffix` renders como atributo inerte en **ambos** | `matsuffix=""` | `matsuffix=""` | ✅ confirma H5 |
| **Única diferencia** | `ngxmatfileinputicon=""` | `appfileinputicon=""` | ⚠️ rename intencionado (D2, exige eslint) |

**SCSS**: diff byte a byte contra el upstream → **idéntico** (4 reglas + `.input-file`).

**Comportamiento**: `npm install @ngxmc/file-input@20.1.0` sin `--legacy-peer-deps` falla con **ERESOLVE** ⇒
confirmación en vivo del bloqueo descrito en la issue #73.

### Desviaciones respecto al plan original (documentadas)

| # | Plan | Realizado | Motivo |
|---|---|---|---|
| 1 | `stateChanges` en la clase base `NgxMatInputMixinBase` | Clase base eliminada; `stateChanges` declarado una sola vez en el componente | H8: la base duplicaba el `Subject` y no formaba parte de la API pública |
| 2 | `this.id = this.id;` en el constructor | `this._id = this._uid;` | `no-self-assign` (error de lint). Comportamiento idéntico |
| 3 | `new Array()` para la lista de ficheros | `[]` | `@typescript-eslint/no-array-constructor` |
| 4 | `registerOnChange(fn: (value: any) => void)` | `registerOnChange(fn: (value: FileOrArrayFile) => void)` | `@typescript-eslint/no-explicit-any`. Sigue cumpliendo `ControlValueAccessor` (bivariancia de métodos) |
| 5 | `onContainerClick(event: MouseEvent)` | `onContainerClick()` | `no-unused-vars` sobre el parámetro. Es compatible con el contrato de `MatFormFieldControl` (implementar con menos parámetros es válido) |
| 6 | `viewChild` (opcional) | `viewChild.required` | El proyecto compila con `strict: true`; la versión opcional no tipa. Las queries de vista por señal se resuelven en la fase de creación, antes de que el `mat-form-field` evalúe `shouldLabelFloat` |
| 7 | `text: string \| null` asignado a `input.value` | `text ?? ''` | `strict` rechaza `null` en `HTMLInputElement.value`. `LegacyNullToEmptyString` del DOM hace exactamente lo mismo |
| 8 | `FileOrArrayFile = File \| Array<File> \| File[]` | `File \| File[]` | `@typescript-eslint/array-type`. Tipo equivalente |

---

## 1. Estado actual (verificado sobre el repo)

### 1.1 El bloqueo

`package.json` declara:

```jsonc
"@ngxmc/file-input": "20.1.0",
"overrides": {
  "@ngxmc/file-input": {
    "@angular/cdk": "21.0.6",
    "@angular/common": "21.0.8",
    ...   // 7 entradas: forzar Angular 21 dentro del árbol de la librería
  }
}
```

La librería declara `peerDependencies: { "@angular/*": "^20.0.0" }` pero el proyecto está en Angular **21.0.8**.
El bloque `overrides` + el flag de CI `npm ci --legacy-peer-deps` (`.github/workflows/node.js.yml`) son los dos
*workarounds* que hoy bloquean un `npm install` limpio. La librería no publica versión para Angular 21.

### 1.2 Superficie de uso (íntegra)

El componente se usa en **un único sitio**:

| Fichero | Línea | Contenido |
|---|---|---|
| `src/app/shared/components/recipe-card-form/recipe-card-form.component.ts` | 29 | `import {NgxMatFileInputComponent} from '@ngxmc/file-input';` |
| `src/app/shared/components/recipe-card-form/recipe-card-form.component.ts` | 64 | `NgxMatFileInputComponent` dentro de `imports: [...]` |
| `src/app/shared/components/recipe-card-form/recipe-card-form.component.html` | 40-44 | `<ngx-mat-file-input accept="image/*" placeholder="Imagen de la receta" formControlName="photo">` + `<mat-icon ngxMatFileInputIcon>folder</mat-icon>` |
| `src/styles/am-components/_am-file-input.scss` | 8 | `ngx-mat-file-input { input.mat-input-element { … } }` |

No hay más referencias a `ngx` / `file-input` en `src/`.

### 1.3 Baseline verificado

| Check | Estado |
|---|---|
| `npx ng build --configuration development` | ✅ OK (~16 s) |
| `npm test` | ✅ 23 ficheros / 120 tests en verde (~13 s) |
| `npm run lint` | pendiente de ejecutar como baseline |

---

## 2. Hallazgos técnicos que condicionan el port

Estos puntos **no** son evidentes al leer la librería y son la razón de que un "copiar y pegar" naïve falle.

### H1 — `strictTemplates: true` rompe la plantilla original

`tsconfig.json` tiene `"strictTemplates": true`. La librería se compilaba con su propio `tsconfig.lib.json`
(sin `strictTemplates`), por eso su plantilla compila allí pero **no** compila aquí:

```html
<!-- upstream: NO compila con strictTemplates -->
<input type="file" #inputFile (change)="handleFiles($event.target.files)" …>
```

`$event` es `Event` → `$event.target` es `EventTarget | null` → `.files` no existe en `EventTarget`.
**Mitigación:** handler tipado en la clase (sin `$any`):

```ts
onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  this.handleFiles(input.files);
}
```
y en la plantilla `(change)="onFileChange($event)"`. `handleFiles` acepta `FileList | null`.

### H2 — `@angular-eslint/prefer-inject` es `error` en este repo

`eslint.config.js` extiende `angular.configs.tsRecommended`, que activa `prefer-inject: error`. La regla
reporta **cualquier** parámetro de constructor con decorador `@Optional/@Self/@Inject/@SkipSelf/@Host`, con
modificador de accesso, o con anotación de tipo. El constructor de la librería (7 parámetros) dispararía
**7 errores** de lint. → El port **debe** usar `inject()`.

### H3 — `no-attribute-decorator` NO está activo

`ts-recommended` de angular-eslint 21 no incluye `no-attribute-decorator`, por lo que **sí** se puede usar
`@Input()` sobre getters/setters (necesario para reproducir la API `disabled`/`multiple`/`required`/… del
upstream). La librería ya mezcla信号 inputs (`color`, `separator`) con `@Input()` clásicos.

### H4 — La regla SCSS global `input.mat-input-element` está **muerta**

Material renombró `mat-input-element` → `mat-mdc-input-element` en v15. Verificado: en Material 21 la clase
`mat-input-element` **no existe** en ningún bundle, y la plantilla de la librería usa
`class="mat-mdc-input-element mat-mdc-form-field-input-control mdc-text-field__input"`.

Consecuencia: en `_am-file-input.scss` la regla

```scss
ngx-mat-file-input { input.mat-input-element { border:none; background:none; color:$white; font-size:14px; … } }
```

**no matchea nada hoy**. El aspecto real del input lo define Material (`.mdc-text-field--outlined … .mdc-text-field__input`).

> ⚠️ **Prohibido "arreglar" esa regla a `mat-mdc-input-element` durante este port**: aplicaría de golpe
> `color: white; font-size: 14px; font-weight: 400; border: none` y **cambiaría el aspecto** respecto al actual.
> La regla debe seguir siendo igual de inerte. (Ver R-04.)

### H5 — `matSuffix` es un atributo **inerte** en la plantilla de la librería

La librería importa sólo `MatIconModule` y `MatButtonModule`; `MatSuffix` **no** está en el scope de su
plantilla, así que `matSuffix` en el `<button>` es un atributo HTML estático sin efecto. En Material 21 la
clase `.mat-mdc-form-field-suffix` ya no existe (ahora es `.mat-mdc-form-field-icon-suffix` /
`…-text-suffix`), por lo que ese `<div>` tampoco tiene estilos: el layout real lo da
`.ngx-mat-file-input { display:flex; align-items:center; }` (SCSS de la librería) + el `mat-icon-button`.

> ⚠️ **Prohibido importar `MatFormFieldModule` en el nuevo componente**: activaría `MatSuffix` como directiva
> real, el botón se registraría como sufijo del `mat-form-field` y **cambiaría el layout**.
> La plantilla se copia **literalmente**, `matSuffix` incluido, con un comentario explicando que es inerte.

### H6 — `MatFormFieldControl` sigue siendo un token inyectable en Material 21

Verificado en `node_modules/@angular/material/types/_form-field-control-chunk.d.ts`: la interfaz no cambió de
forma respecto a la que implementa la librería (`value`, `stateChanges`, `id`, `placeholder`, `ngControl`,
`focused`, `empty`, `shouldLabelFloat`, `required`, `disabled`, `errorState`, `controlType`, `autofilled`,
`setDescribedByIds`, `onContainerClick`). El patrón
`providers: [{provide: MatFormFieldControl, useExisting: forwardRef(() => FileInputComponent)}]` sigue siendo válido.

### H7 — `useDefineForClassFields: false`

`tsconfig.json` lo tiene a `false` (comportamiento legacy). Las clases de campo se **asignan** en el
constructor, no se definen. Implica que:
- el orden de las inicializadores de campo importa (`_uid` debe inicializarse **antes** de `this.id = this.id`),
- los `@Input()` sobre getter/setter siguen funcionando (el setter corre en el `ngOnChanges`),
- `inject()` en inicializadores de campo funciona (el contexto de inyección está activo).

### H8 — La clase base `NgxMatInputMixinBase` duplica `stateChanges`

La base declara `readonly stateChanges = new Subject<void>()` **y** la subclase lo redeclara. Gana la de la
subclase (se inicializa después del `super()`). Es un residuo del patrón `MatInput` antiguo de Material.
La base **no** forma parte de la API pública del paquete → se puede eliminar sin cambiar la API.

---

## 3. Decisiones de diseño (✅ RESUELTAS — cerrado con el usuario)

| # | Decisión | Valor elegido | Consecuencia |
|---|---|---|---|
| **D1** | Selector del elemento | **`app-file-input`** | Cumple `component-selector` (prefix `app`) sin tocar `eslint.config.js`. |
| **D2** | Selector de la directiva | **`appFileInputIcon`** | Cumple `directive-selector` (prefix `app`, camelCase). |
| **D3** | Nombres de clase CSS internos | **Conservar** (`ngx-mat-file-input`, `ngx-mat-file-input--default-icon`, `input-file`, `button-browse`) | El SCSS del componente se copia **literal** ⇒ **cero riesgo visual**. `ngx-` queda como residuo histórico inofensivo. |
| **D4** | Validadores/helpers del upstream (`MaxSizeValidator`, `AcceptValidator`, `calculFileSize`) | **NO portarlos** | El proyecto ya valida el MIME con `UtilService.validateFile` + `imageValidator`. Se evita código muerto. **Sí se porta el tipo `FileOrArrayFile`** (lo necesita el componente). |
| **D5** | `yarn.lock` | **Borrarlo** | La CI usa npm (`cache: 'npm'` + `npm ci`). **Corrección sobre lo planificado:** `yarn.lock` estaba en `.gitignore` (línea 52) y no estaba trackeado ⇒ no hay cambio en el repo, sólo limpieza del working copy local. |
| **D6** | CI: `npm ci --legacy-peer-deps` → `npm ci` | **Sí, cambiar** | Es el objetivo real de la issue #73. |
| **D7** | `ChangeDetectionStrategy` | **No usar `OnPush`** | El upstream no lo usa; `MatFormFieldControl` + OnPush introduce matices con `stateChanges`/`markForCheck`. Optimización posterior, fuera de alcance. |

---

## 4. Arquitectura del componente nuevo

### 4.1 Ficheros a crear (todos nuevos → sin conflictos con otros agentes)

```
src/app/shared/components/file-input/
├── file-input.component.ts        # FileInputComponent
├── file-input.component.html
├── file-input.component.scss
├── file-input-icon.directive.ts   # FileInputIconDirective  (selector: [appFileInputIcon])
├── file-input.types.ts            # export type FileOrArrayFile = File | Array<File> | File[];
└── file-input.component.spec.ts
```

**5 ficheros** (D4: no se portan `MaxSizeValidator`, `AcceptValidator` ni `calculFileSize` — no se usan en el proyecto).

### 4.2 API pública (idéntica al upstream)

| Input | Tipo | Default | Notas |
|---|---|---|---|
| `color` | `ThemePalette` (signal input) | `'primary'` | `input<ThemePalette>('primary')` |
| `separator` | `string` (signal input) | `','` | `input<string>(',')` |
| `disabled` | `boolean` | `false` | getter: si hay `ngControl` devuelve `ngControl.disabled` |
| `id` | `string` | `ngx-mat-fileinput-${n}` | getter/setter |
| `multiple` | `boolean` | `false` | `coerceBooleanProperty` |
| `placeholder` | `string` | `'Choose a file'` | atributo plano |
| `required` | `boolean` | `false` | `coerceBooleanProperty` |
| `errorStateMatcher` | `ErrorStateMatcher` | – | atributo plano |
| `value` | `FileOrArrayFile` | – | getter/setter |
| `readonly` | `boolean` | `true` | `coerceBooleanProperty` |
| `accept` | `string` | – | getter/setter |

Directive: `FileInputIconDirective` — selector `[appFileInputIcon]`, sin comportamiento, sólo marca el
`<mat-icon>` que se proyecta en el botón.

`exportAs`: `'app-file-input'` (el upstream exporta `'ngx-mat-file-input'`).
`controlType`: `'app-file-input'` → genera la clase `mat-form-field-type-app-file-input` en el `mat-form-field`.
**Ningún CSS del proyecto usa la clase `mat-form-field-type-*`** (verificado con `grep`), así que renombrarla
no tiene impacto visual; se renombra por coherencia con D1.

### 4.3 Decorador del componente

```ts
@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss'],
  encapsulation: ViewEncapsulation.None,        // ← idéntico al upstream
  host: {class: 'ngx-mat-file-input'},          // ← nombre de clase conservado (D3)
  providers: [{
    provide: MatFormFieldControl,
    useExisting: forwardRef(() => FileInputComponent),
  }],
  exportAs: 'app-file-input',
  imports: [MatIconModule, MatButtonModule],    // ← NO añadir MatFormFieldModule (H5)
})
```

### 4.4 Plantilla (copia literal del upstream, con el fix de H1)

```html
<input
  #inputValue
  autocomplete="off"
  class="mat-mdc-input-element mat-mdc-form-field-input-control mdc-text-field__input"
  [attr.id]="id"
  [attr.placeholder]="placeholder"
  [disabled]="disabled"
  [required]="required"
  [attr.readonly]="readonly || null"
  [attr.aria-describedby]="_ariaDescribedby || null"
  [attr.aria-invalid]="errorState"
  [attr.aria-required]="required.toString()"
/>
<div class="mat-mdc-form-field-suffix">
  <button
    matSuffix
    mat-icon-button
    [color]="color()"
    class="button-browse"
    (click)="openFilePicker($event)"
    type="button"
    [disabled]="disabled"
  >
    <ng-content select="[appFileInputIcon]">
      <mat-icon class="ngx-mat-file-input--default-icon">attach_file</mat-icon>
    </ng-content>
  </button>
</div>
<input
  type="file"
  #inputFile
  (change)="onFileChange($event)"
  class="input-file"
  [multiple]="multiple"
  [accept]="accept"
/>
```

Único cambio respecto al upstream: `(change)="handleFiles($event.target.files)"` → `(change)="onFileChange($event)"`
(H1). El atributo `matSuffix` se conserva aunque sea inerte (H5), con un comentario en el código.

### 4.5 SCSS del componente (copia literal del upstream)

```scss
.mat-mdc-form-field-appearance-outline {
  .mat-form-field-prefix,
  .mat-form-field-suffix {
    .ngx-mat-file-input--default-icon { width: 1em; }
  }
}
.mat-mdc-form-field:not(.mat-form-field-appearance-outline) {
  .mat-form-field-prefix,
  .mat-form-field-suffix {
    .ngx-mat-file-input--default-icon { display: block; width: 1.5em; height: 1.5em; }
    .mat-icon-button .ngx-mat-file-input--default-icon { margin: auto; }
  }
}
.ngx-mat-file-input {
  display: flex;
  line-height: 18px;
  align-items: center;
  .input-file { display: block; visibility: hidden; width: 0; height: 0; }
}
```

Tamaño ≈ 1,1 KB ⇒ dentro del budget `anyComponentStyle` (warning 2 kb / error 4 kb). ✅

### 4.6 Clase (puerto con `inject()` por H2)

```ts
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {Platform} from '@angular/cdk/platform';
import {
  ChangeDetectorRef, Component, DoCheck, ElementRef, forwardRef, inject, Input,
  OnChanges, OnDestroy, viewChild, ViewEncapsulation
} from '@angular/core';
import {ControlValueAccessor, FormGroupDirective, NgControl, NgForm} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {ErrorStateMatcher, ThemePalette} from '@angular/material/core';
import {MatFormFieldControl} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {Subject} from 'rxjs';
import {FileOrArrayFile} from './file-input.types';

let nextUniqueId = 0;

@Component({ /* … §4.3 … */ })
export class FileInputComponent
  implements MatFormFieldControl<FileOrArrayFile>, OnChanges, OnDestroy, DoCheck, ControlValueAccessor {

  // ── DI (H2: usar inject(), no constructor DI) ────────────────────────────
  private readonly _elementRef = inject(ElementRef) as ElementRef<HTMLElement>;
  private readonly _platform = inject(Platform);
  private readonly _cd = inject(ChangeDetectorRef);
  readonly ngControl = inject(NgControl, {optional: true, self: true});
  private readonly _parentForm = inject(NgForm, {optional: true});
  private readonly _parentFormGroup = inject(FormGroupDirective, {optional: true});
  private readonly _defaultErrorStateMatcher = inject(ErrorStateMatcher);

  // ── queries ─────────────────────────────────────────────────────────────
  private readonly _inputFileRef = viewChild<ElementRef<HTMLInputElement>>('inputFile');
  private readonly _inputValueRef = viewChild<ElementRef<HTMLInputElement>>('inputValue');

  // ── inputs ──────────────────────────────────────────────────────────────
  readonly color = input<ThemePalette>('primary');
  readonly separator = input<string>(',');
  @Input() placeholder = 'Choose a file';
  @Input() errorStateMatcher: ErrorStateMatcher;

  @Input() get disabled(): boolean {
    return this.ngControl?.disabled !== null && this.ngControl ? this.ngControl.disabled : this._disabled;
  }
  set disabled(value: boolean) { /* upstream literal */ }
  protected _disabled = false;

  @Input() get id(): string { return this._id; }
  set id(value: string) { this._id = value || this._uid; }
  protected _id: string;

  @Input() get multiple(): boolean { return this._multiple; }
  set multiple(value: boolean) { this._multiple = coerceBooleanProperty(value); }
  protected _multiple = false;

  @Input() get required(): boolean { return this._required; }
  set required(value: boolean) { this._required = coerceBooleanProperty(value); }
  protected _required = false;

  @Input() get value(): FileOrArrayFile { return this._value; }
  set value(value: FileOrArrayFile) { this._value = value; }
  protected _value: FileOrArrayFile;

  @Input() get readonly(): boolean { return this._readonly; }
  set readonly(value: boolean) { this._readonly = coerceBooleanProperty(value); }
  private _readonly = true;

  @Input() get accept(): string { return this._accept; }
  set accept(value: string) { this._accept = value; }
  private _accept: string;

  // ── estado ──────────────────────────────────────────────────────────────
  protected _uid = `ngx-mat-fileinput-${nextUniqueId++}`;
  readonly stateChanges = new Subject<void>();     // H8: una sola instancia (base eliminada)
  focused = false;
  errorState: boolean;
  controlType = 'app-file-input';
  autofilled = false;
  _ariaDescribedby: string;
  _onTouched = () => {};
  _onChange: (value: FileOrArrayFile) => void = () => {};

  constructor() {
    this.id = this.id;                            // _id ← _uid
    if (this.ngControl) { this.ngControl.valueAccessor = this; }
  }

  ngOnChanges(): void { this.stateChanges.next(); }
  ngOnDestroy(): void { this.stateChanges.complete(); }
  ngDoCheck(): void { if (this.ngControl) { this.updateErrorState(); } }

  updateErrorState(): void { /* upstream literal */ }
  writeValue(value: FileOrArrayFile): void { this._updateInputValue(value); }
  registerOnChange(fn: (value: FileOrArrayFile) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; this.stateChanges.next(); }
  focus(options?: FocusOptions): void { this._inputValueRef().nativeElement.focus(options); }
  _focusChanged(isFocused: boolean): void { /* upstream literal */ }
  _markAsTouched(): void { this._onTouched(); this._cd.markForCheck(); this.stateChanges.next(); }
  protected _isBadInput(): boolean { /* upstream literal */ }
  get empty(): boolean { /* upstream literal */ }
  get shouldLabelFloat(): boolean { return this.focused || !this.empty; }
  setDescribedByIds(ids: string[]): void { this._ariaDescribedby = ids.join(' '); }
  openFilePicker(event?: MouseEvent): void { /* upstream literal */ }
  handleFiles(filelist: FileList | null): void { /* upstream literal */ }
  onContainerClick(_event: MouseEvent): void { /* no-op */ }

  // ── NUEVO: tipado para strictTemplates (H1) ─────────────────────────────
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handleFiles(input.files);
  }

  private _resetInputFile(): void { this._inputFileRef().nativeElement.value = ''; }
  private _updateInputValue(files: FileOrArrayFile): void { /* upstream literal */ }
}
```

Notas de fidelidad:
- `disabled` getter: el upstream hace `if (this.ngControl && this.ngControl.disabled !== null) return this.ngControl.disabled;`.
  Se mantiene literal (el `?.` puede devolver `undefined` vs `null`; usar la forma exacta del upstream).
- `_updateInputValue` usa `this.separator()` (signal) y `this._multiple`.
- Se elimina la clase base `NgxMatInputMixinBase` (H8) → `stateChanges` queda declarado una sola vez.
- `_elementRef` y `_platform` no se usan (upstream tampoco) → se pueden omitir; se Recommendan mantenerlos por
  paridad, o marcarlos `// eslint-disable` si `no-unused-vars` complains (no lo hace para campos privados
  *usados*; TS `noUnusedLocals` está apagado).

---

## 5. Cambios en el consumidor

### `src/app/shared/components/recipe-card-form/recipe-card-form.component.ts`

```diff
-import {NgxMatFileInputComponent} from '@ngxmc/file-input';
+import {FileInputComponent} from '../file-input/file-input.component';
+import {FileInputIconDirective} from '../file-input/file-input-icon.directive';
```

```diff
   imports: [
     ...
-    NgxMatFileInputComponent,
+    FileInputComponent,
+    FileInputIconDirective,
     ...
   ]
```

### `src/app/shared/components/recipe-card-form/recipe-card-form.component.html`

```diff
-                <ngx-mat-file-input accept="image/*"
-                                    placeholder="Imagen de la receta"
-                                    formControlName="photo">
-                  <mat-icon ngxMatFileInputIcon>folder</mat-icon>
-                </ngx-mat-file-input>
+                <app-file-input accept="image/*"
+                                placeholder="Imagen de la receta"
+                                formControlName="photo">
+                  <mat-icon appFileInputIcon>folder</mat-icon>
+                </app-file-input>
```

> El `mat-form-field` que lo envuelve (`appearance="outline"`, `class="file-input__wrapper"`) **no se toca**:
> el `mat-error` de `hasError('image')` y el `mat-hint` siguen funcionando igual porque `FileInputComponent`
> implementa `MatFormFieldControl` igual que el upstream.

### `src/styles/am-components/_am-file-input.scss`

```diff
-ngx-mat-file-input {
+app-file-input {
   input.mat-input-element {
     border: none;
     background: none;
     outline: none;
     color: variables.$white;
     font-size: 14px;
     font-weight: 400;
   }
 }
```

> ⚠️ **NO cambiar `mat-input-element` → `mat-mdc-input-element`** (H4). La regla debe seguir tan inerte como hoy,
> para no alterar el aspecto del input. La limpieza de esa regla es una issue aparte.

---

## 6. Dependencias y tooling

### `package.json`

```diff
   "dependencies": {
     ...
-    "@ngxmc/file-input": "20.1.0",
     ...
-  },
-  "overrides": {
-    "@ngxmc/file-input": {
-      "@angular/cdk": "21.0.6",
-      "@angular/common": "21.0.8",
-      "@angular/core": "21.0.8",
-      "@angular/forms": "21.0.8",
-      "@angular/material": "21.0.6",
-      "@angular/platform-browser": "21.0.8"
-    }
   }
```

### Lockfiles

- `package-lock.json` → regenerar con `npm install` (elimina la entrada `@ngxmc/file-input` y el `overrides`).
- `yarn.lock` → **borrar** (D5) o regenerar. Contiene `@ngxmc/file-input@20.1.0` (línea 2135).

### `.github/workflows/node.js.yml`

```diff
-    - run: npm ci --legacy-peer-deps
+    - run: npm ci
```

Verificar que `npm ci` (sin `--legacy-peer-deps`) resuelve sin conflictos de peer deps con el resto del árbol
(`@angular/fire@21.0.0-rc.0`, `@vitest/browser-playwright@4`, `vitest@4`).

---

## 7. Plan de ejecución (DAG, apto para agentes en paralelo)

> **Regla de oro para el paralelismo:** cada agente es dueño de un conjunto de ficheros **disjuntos**.
> Ningún par de agentes escribe en el mismo fichero, así que no hay conflictos de merge.

```
FASE 0  (bloqueante · 1 agente · 10 min)
  Decidir D1..D7 · crear rama `feature/73-replace-ngxmc-file-input` · baseline lint/build/test
        │
        ├──────────────── FASE 1 (paralelo, 3 agentes, sin dependencias entre ellos) ────────────────┐
        │                                                                                            │
  AGENTE A — Componente              AGENTE B — Estilos globales        AGENTE C — Deps & tooling    │
  (crea ficheros nuevos)              (1 fichero)                       (package.json, lockfiles, CI)  │
  src/app/shared/components/         src/styles/am-components/          package.json                    │
    file-input/*                       _am-file-input.scss               package-lock.json               │
    (5 ficheros nuevos)                                                    yarn.lock (borrar)              │
  Tarea: §4.1 → §4.6                   Tarea: §5 (bloque SCSS)           .github/workflows/node.js.yml   │
  + spec §8.1                         RIESGO: 1 línea                    Tarea: §6                        │
                                                                                                     │
        └──────────────────────────────────┬──────────────────────────────────────────────────────────┘
                                           │
        FASE 2 (1 agente · 20 min)  — requiere A y B en disco
        AGENTE D — Migración del consumidor
        src/app/shared/components/recipe-card-form/recipe-card-form.component.ts
        src/app/shared/components/recipe-card-form/recipe-card-form.component.html
        Tarea: §5
                                           │
        FASE 3 (1 agente · 10 min)  — requiere D
        AGENTE E — Regeneración de lockfiles + limpieza
        npm install (regenera package-lock.json) · npm ls @ngxmc/file-input → debe salir vacío
                                           │
        FASE 4 (1 agente · 30 min)  — verificación
        AGENTE F — Verificación (§8)
```

### Reparto alternative por fases (menos agentes)

- **F1** → A+B+C+D (1 agente, PR único) → E+F.
- **F2** → A+B+C (paralelo) → D → E → F. *← el recomendado*
- **F3** → A+B+C+D+E (paralelo) → F.

### Orden de merge

`Fase 1` (3 PRs o 3 commits) → `Fase 2` → `Fase 3` → `Fase 4`.
Si se quiere un único PR, todos los commits se pueden aplastar al final.

---

## 8. Verificación

### 8.1 Tests nuevos (`file-input.component.spec.ts`)

Envolver el componente en un `mat-form-field` + `ReactiveFormsModule` para ejercitar el contrato completo.

| Test | Qué valida |
|---|---|
| `should create` | instancia |
| `should display the file name in the input` | `writeValue(file)` → `input.value === file.name` |
| `should propagate the selected file to the form control` | `handleFiles()` → el `FormControl` recibe el `File` |
| `should propagate an array when multiple` | `multiple=true` → el control recibe `File[]` |
| `should join multiple file names with the separator` | `separator=','` → el input muestra `a.jpg, b.jpg` |
| `should render the default icon` | existe `mat-icon.ngx-mat-file-input--default-icon` |
| `should project the custom icon` | `<mat-icon appFileInputIcon>folder</mat-icon>` se renderiza en el botón |
| `should be disabled when the control is disabled` | `control.disable()` → `disabled === true` |
| `should mark the control as touched when the picker opens` | `openFilePicker()` → `touched === true` |
| `should reflect the error state` | `control.setErrors({image:true})` → `errorState === true` |

Técnica para simular la selección de fichero (jsdom no permite asignar `input.files`):

```ts
const file = new File(['x'], 'test.png', {type: 'image/png'});
const dt = new DataTransfer();
dt.items.add(file);
const input = fixture.nativeElement.querySelector('input[type="file"]');
input.files = dt.files;
input.dispatchEvent(new Event('change'));
```

Si `DataTransfer` no está disponible en el entorno de test, usar
`Object.defineProperty(input, 'files', {value: [file]})` + llamada directa a `component.handleFiles(...)`.

### 8.2 Comandos de verificación (Fase 4)

```bash
npm run lint                 # 0 errores (en particular: selector app-*, prefer-inject, strictTemplates)
npm test                     # ≥ 23 ficheros, todos en verde (+ los nuevos)
npm run build                # build de producción OK (budgets: anyComponentStyle < 2kb)
npx ng build --configuration development
npm ls @ngxmc/file-input      # debe imprimir "(empty)"
grep -rn "ngxmc\|ngx-mat-file-input\|ngxMatFileInput" src/ package.json package-lock.json
#   → sólo debe quedar la clase CSS interna "ngx-mat-file-input" (D3) y el uid "ngx-mat-fileinput-"
```

### 8.3 Verificación visual manual (obligatoria)

En la pantalla de **Nueva receta** / **Editar receta** (usuarios autenticados), comparar antes/después:

- [ ] El input de texto muestra "Imagen de la receta" como placeholder, con el mismo color/tamaño que ahora.
- [ ] El icono `folder` aparece a la derecha, con el mismo tamaño y posición.
- [ ] Al seleccionar una imagen, el nombre del fichero aparece en el input.
- [ ] La previsualización de la imagen (`mat-card-image`) aparece igual.
- [ ] Con un `.gif`/`.png` no válido, aparece el `mat-error` "Formato de archivo incorrecto".
- [ ] La barra de progreso de subida funciona igual.
- [ ] El botón "Subir imagen" mantiene su estado disabled.
- [ ] El `mat-form-field` con `appearance="outline"` tiene la misma altura/alineación.

Comparar con `git stash` de los cambios del port (o contra `origin/master`) usando capturas antes/después.

---

## 9. Riesgos

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| **R-01** | **`strictTemplates` rompe la plantilla** (§H1) — el error de compilación más probable al portar | Alta | Bloqueante | Handler tipado `onFileChange(event: Event)` (§4.4). `npm run build` en Fase 1 lo detecta. |
| **R-02** | **`prefer-inject` falla** (§H2) — los 7 parámetros del constructor del upstream son todos reportados | Alta | Bloqueante | Reescribir la DI con `inject()` (§4.6). `npm run lint` en Fase 1. |
| **R-03** | **Selector no conforme con eslint** (§D1/D2) | Alta | Bloqueante | Usar `app-file-input` / `appFileInputIcon`; `npm run lint` en Fase 1. |
| **R-04** | **"Arreglar" la regla SCSS global y cambiar el aspecto** (§H4) | Media | **Alto** (regresión visual silenciosa) | Regla intocable en este port; checklist visual §8.3; comment en el SCSS explicando que la regla está inerte a propósito. |
| **R-05** | **Importar `MatFormFieldModule` en el componente y activar `MatSuffix`** (§H5) → el botón se convierte en sufijo real del form-field y **cambia el layout** | Media | **Alto** (regresión visual) | `imports: [MatIconModule, MatButtonModule]` tal cual; comment en la plantilla. |
| **R-06** | **Cambio de layout por `controlType`/`exportAs`** | Baja | Bajo | `controlType` no lo usa ningún CSS del repo; renombrar y verificar visualmente. |
| **R-07** | **Pérdida de la `mat-error`** si `updateErrorState`/`ngDoCheck` no se portan bien | Media | Alto | Portar `ngDoCheck` + `updateErrorState` literales; test "should reflect the error state"; check visual del `mat-error`. |
| **R-08** | **Regresión en el `FormControl`**: `handleFiles` debe llamar `_onChange` con `File` (no array) salvo `multiple`; y `_resetInputFile()` para poder re-seleccionar el mismo fichero | Media | Alto | Port literal + tests "should propagate the selected file" y "should propagate an array when multiple". |
| **R-09** | **`npm ci` sin `--legacy-peer-deps` falla** por otro peer conflict (p. ej. `@angular/fire@21.0.0-rc.0` o `vitest@4`) | Media | Medio | Probar `npm ci` en limpio en un worktree/temp antes de tocar la CI; si falla, aislar con `overrides` puntuales y documentarlas. **Este es el riesgo que puede dejar la issue sin cerrar.** |
| **R-10** | **Lockfiles desincronizados** (`package-lock.json` + `yarn.lock` con `@ngxmc`) | Media | Medio | Regenerar `package-lock.json`; borrar `yarn.lock` (D5). `npm ci` falla si el lock no cuadra con `package.json` → el propio CI lo detecta. |
| **R-11** | **Doble lockfile / gestores mezclados** en el equipo | Media | Bajo | Decidir npm como canónico (la CI ya lo es) y borrar `yarn.lock`. |
| **R-12** | **Budget `anyComponentStyle`** (warning 2 kb / error 4 kb) con el SCSS del componente | Baja | Medio | SCSS ≈ 1,1 KB; medir con `npm run build` (producción). |
| **R-13** | **Colisión de clases CSS globales**: `ViewEncapsulation.None` + clase `ngx-mat-file-input` | Baja | Bajo | Se elimina la librería ⇒ no hay colisión con `@ngxmc`. La clase `ngx-mat-file-input` sólo la usa este componente. |
| **R-14** | **Tests existentes que rompen** al cambiar el template de `recipe-card-form` | Baja | Medio | `recipe-card-form.component.spec.ts` usa `.overrideTemplate(RecipeCardFormComponent, '')` → la plantilla no se renderiza en el test ⇒ **no hay impacto**. Verificar igual con `npm test`. |
| **R-15** | **Pérdida de `accept`/filtro de ficheros**: `accept` es un atributo del `<input type="file">` nativo, no un validador | Baja | Medio | El `accept="image/*"` se mantiene (atributo nativo) + el `imageValidator` del `recipe-card-form` sigue validando por MIME. No portar `AcceptValidator` salvo que se use (D4). |
| **R-16** | **Accesibilidad**: `aria-required`, `aria-invalid`, `aria-describedby` los gestiona `MatFormField` vía `setDescribedByIds` | Baja | Medio | Portar `setDescribedByIds` literal; verificar que el `mat-error` queda bien vinculado. |
| **R-17** | **Cambio de `controlType`** ⇒ el `mat-form-field` aplica `mat-form-field-type-<controlType>` | Baja | Bajo | Sin CSS dependiente en el repo; un `grep` lo confirma. |
| **R-18** | **Merge de las 4 ramas de agente**: si un agente toca un fichero de otro, hay conflictos | Media | Bajo | Matriz de propiedad exclusiva (§7). Cada agente trabaja en su rama; el merge es trivial porque los ficheros son disjuntos. |
| **R-19** | **Fallo de `npm test` en el CI por la config de Vitest/browser** | Baja | Medio | Baseline ya verde (23/120). Ejecutar `npm test` en local tras cada fase. |
| **R-20** | **Regresión en la actualización de Angular**: quitar el `overrides` cambia la resolución de todo el árbol | Media | Medio | `npm ci` en limpio + `npm ls` + build + test. Este es el *beneficio* buscado, pero también el punto donde puede aparecer un conflicto latente. |

### Riesgos que se materializaron durante la implementación

| Riesgo | Qué pasó | Resolución |
|---|---|---|
| **R-01** (`strictTemplates`) | Se materializó: `handleFiles($event.target.files)` no compila. Se resolvió con el handler tipado `onFileChange(event: Event)` (§4.4). | ✅ Resuelto |
| **R-02** (`prefer-inject`) | Se materializó: los 7 parámetros del constructor del upstream dan 7 errores de lint. Se reescribió toda la DI con `inject()`. | ✅ Resuelto |
| **R-03** (selectors eslint) | Se materializó: `ngx-mat-file-input` / `ngxMatFileInputIcon` violan las reglas de prefijo `app`. Se renombraron (D1/D2). | ✅ Resuelto |
| **R-09** (`npm ci` sin `--legacy-peer-deps`) | **No** se materializó: `npm install` y `npm ci` en limpio resuelven sin ERESOLVE una vez retirada la librería. El conflicto sólo existía por `@ngxmc/file-input`. | ✅ Descartado |
| **R-14** (tests existentes) | No se materializó: `recipe-card-form.component.spec.ts` hace `overrideTemplate(..., '')`. Los 120 tests previos siguen en verde. | ✅ Descartado |
| **R-12** (budget de estilos) | No se materializó: el SCSS del componente es ~1,1 KB y el build de producción no emite warnings. | ✅ Descartado |
| **R-10/R-11** (lockfiles) | Corrección: `yarn.lock` estaba gitignored y no trackeado ⇒ no era un riesgo real para el repo. | ✅ Resuelto |

Riesgos que siguen abiertos y **no** se pueden cerrar automáticamente: **R-04** (regla SCSS inerte), **R-05**
(`matSuffix` inerte), **R-06/R-17** (`controlType`) y **R-16** (accesibilidad) dependen de la revisión visual
manual del checklist §8.3.

### Fuera de alcance (issues futuras sugeridas)

- Limpiar la regla SCSS muerta `input.mat-input-element` (§H4) — requiere revisar el aspecto de todos los inputs.
- Eliminar `src/styles/am-components/_am-file-input.scss` si al final sólo queda CSS inerte.
- Migrar `FileInputComponent` a signal inputs / `OnPush` (D7).
- Añadir `MaxSizeValidator` / `AcceptValidator` reales con tests, si algún día se necesitan (D4).

---

## 10. Criterios de aceptación

- [x] `src/` no contiene ninguna referencia a `@ngxmc/file-input`, `NgxMatFileInputComponent` ni `ngxMatFileInputIcon`.
      *Única mención: un comentario de documentación en `file-input.component.ts` que explica el origen del componente.*
- [x] `package.json` no declara `@ngxmc/file-input` ni el bloque `overrides` asociado.
- [x] `npm ls @ngxmc/file-input` → vacío.
- [x] `npm ci` (sin `--legacy-peer-deps`) funciona en limpio (758 paquetes, sin ERESOLVE).
- [x] `npm run lint` → 0 errores.
- [x] `npm test` → todos en verde (24 ficheros / 132 tests; baseline 23/120 + 12 nuevos).
- [x] `npm run build` → OK, dentro de budgets (initial total 1.65 MB).
- [x] El componente nuevo es **estáticamente idéntico** al anterior: comparación A/B del DOM + diff byte a byte del SCSS (§0.1).
- [x] `app-file-input` funciona con `formControlName`, `accept`, `placeholder`, `multiple`, `disabled` e icono personalizado (12 tests).
- [ ] Checklist visual §8.3 — pendiente de revisión manual en la app.
- [ ] Issue #73 actualizada con el checklist de verificación marcado.

---

## 11. Commits sugeridos

```
refactor(shared): add app-file-input component replacing @ngxmc/file-input
refactor(recipe-card-form): use app-file-input instead of ngx-mat-file-input
style(am-components): update file-input global selector to app-file-input
chore(deps): remove @ngxmc/file-input dependency and its overrides
chore(ci): drop --legacy-peer-deps from npm ci
```
