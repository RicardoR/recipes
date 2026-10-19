import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {Platform} from '@angular/cdk/platform';
import {
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  forwardRef,
  inject,
  Input,
  input,
  OnChanges,
  OnDestroy,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {ErrorStateMatcher, ThemePalette} from '@angular/material/core';
import {MatFormFieldControl} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {Subject} from 'rxjs';

import {FileOrArrayFile} from './file-input.types';

let nextUniqueId = 0;

/**
 * Input de fichero para Angular Material.
 *
 * Sustituye a `@ngxmc/file-input`, que no publica versión compatible con Angular 21
 * (ver issue #73). Mantiene la misma API y el mismo aspecto que el componente original.
 *
 *Uso:
 * ```html
 * <mat-form-field>
 *   <app-file-input [formControl]="fileControl" [accept]="accept">
 *     <mat-icon appFileInputIcon>folder</mat-icon>
 *   </app-file-input>
 * </mat-form-field>
 * ```
 */
@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss'],
  // `None` para que las reglas de estilo apliquen también al contenido proyectado,
  // igual que hacía el componente original.
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ngx-mat-file-input',
  },
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: forwardRef(() => FileInputComponent),
    },
  ],
  exportAs: 'app-file-input',
  // OJO: no añadir `MatFormFieldModule`. El atributo `matSuffix` de la plantilla es
  // inerte a propósito (igual que en el componente original): si la directiva
  // `MatSuffix` entrara en el scope, el botón pasaría a ser un sufijo real del
  // `mat-form-field` y el layout cambiaría.
  imports: [MatIconModule, MatButtonModule],
})
export class FileInputComponent
  implements
    MatFormFieldControl<FileOrArrayFile>,
    OnChanges,
    OnDestroy,
    DoCheck,
    ControlValueAccessor {
  protected readonly _elementRef = inject(ElementRef);
  protected readonly _platform = inject(Platform);
  private readonly _cd = inject(ChangeDetectorRef);
  readonly ngControl = inject(NgControl, {optional: true, self: true});
  private readonly _parentForm = inject(NgForm, {optional: true});
  private readonly _parentFormGroup = inject(FormGroupDirective, {optional: true});
  private readonly _defaultErrorStateMatcher = inject(ErrorStateMatcher);

  private readonly _inputFileRef = viewChild.required<ElementRef<HTMLInputElement>>('inputFile');
  private readonly _inputValueRef = viewChild.required<ElementRef<HTMLInputElement>>('inputValue');

  readonly color = input<ThemePalette>('primary');
  readonly separator = input<string>(',');

  @Input() placeholder = 'Choose a file';
  @Input() errorStateMatcher?: ErrorStateMatcher;

  @Input()
  get disabled(): boolean {
    if (this.ngControl && this.ngControl.disabled !== null) {
      return this.ngControl.disabled;
    }
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    if (this.focused) {
      this.focused = false;
      this.stateChanges.next();
    }
  }
  protected _disabled = false;

  @Input()
  get id(): string {
    return this._id;
  }
  set id(value: string) {
    this._id = value || this._uid;
  }
  protected _id: string;

  @Input()
  get multiple(): boolean {
    return this._multiple;
  }
  set multiple(value: boolean) {
    this._multiple = coerceBooleanProperty(value);
  }
  protected _multiple = false;

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
  }
  protected _required = false;

  @Input()
  get value(): FileOrArrayFile {
    return this._value;
  }
  set value(value: FileOrArrayFile) {
    this._value = value;
  }
  protected _value!: FileOrArrayFile;

  @Input()
  get readonly(): boolean {
    return this._readonly;
  }
  set readonly(value: boolean) {
    this._readonly = coerceBooleanProperty(value);
  }
  private _readonly = true;

  /**
   * Limiting accepted file types
   * Example: accept="image/png, image/jpeg" or accept=".png, .jpg, .jpeg" — Accept PNG or JPEG files.
   */
  @Input()
  get accept(): string {
    return this._accept;
  }
  set accept(value: string) {
    this._accept = value;
  }
  private _accept!: string;

  protected _uid = `ngx-mat-fileinput-${nextUniqueId++}`;
  readonly stateChanges = new Subject<void>();
  focused = false;
  errorState!: boolean;
  controlType = 'app-file-input';
  autofilled = false;
  _ariaDescribedby!: string;

  /** Function when touched */
  _onTouched = (): void => {
    // no-op hasta que se registre un callback
  };

  /** Function when changed */
  _onChange: (value: FileOrArrayFile) => void = (): void => {
    // no-op hasta que se registre un callback
  };

  constructor() {
    // Equivale al `this.id = this.id` del componente original: el setter cae en `_uid`
    // porque `_id` todavía está vacío.
    this._id = this._uid;

    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnChanges(): void {
    this.stateChanges.next();
  }

  ngOnDestroy(): void {
    this.stateChanges.complete();
  }

  ngDoCheck(): void {
    if (this.ngControl) {
      this.updateErrorState();
    }
  }

  updateErrorState(): void {
    const control = this.ngControl ? this.ngControl.control : null;

    this.errorState = (
      this.errorStateMatcher ?? this._defaultErrorStateMatcher
    ).isErrorState(control, this._parentForm);
  }

  // Implemented as part of ControlValueAccessor.
  writeValue(value: FileOrArrayFile): void {
    this._updateInputValue(value);
  }

  // Implemented as part of ControlValueAccessor.
  registerOnChange(fn: (value: FileOrArrayFile) => void): void {
    this._onChange = fn;
  }

  // Implemented as part of ControlValueAccessor.
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.stateChanges.next();
  }

  /** Focuses the input. */
  focus(options?: FocusOptions): void {
    this._inputValueRef().nativeElement.focus(options);
  }

  _focusChanged(isFocused: boolean): void {
    if (isFocused !== this.focused && (!this.readonly || !isFocused)) {
      this.focused = isFocused;
      this.stateChanges.next();
    }
  }

  /** Mark the field as touched */
  _markAsTouched(): void {
    this._onTouched();
    this._cd.markForCheck();
    this.stateChanges.next();
  }

  protected _isBadInput(): boolean {
    const validity = this._inputValueRef().nativeElement.validity;
    return validity && validity.badInput;
  }

  get empty(): boolean {
    return (
      !this._inputValueRef().nativeElement.value &&
      !this._isBadInput() &&
      !this.autofilled
    );
  }

  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  setDescribedByIds(ids: string[]): void {
    this._ariaDescribedby = ids.join(' ');
  }

  openFilePicker(event?: MouseEvent): void {
    this._inputFileRef().nativeElement.click();
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this._markAsTouched();
  }

  handleFiles(filelist: FileList | null): void {
    if (filelist && filelist.length > 0) {
      const files: File[] = [];
      for (let i = 0; i < filelist.length; i++) {
        files.push(filelist.item(i) as File);
      }
      this._updateInputValue(files);
      this._resetInputFile();
      this._onChange(this.multiple ? files : files[0]);
    }
  }

  /**
   * Maneja el evento `change` del input de tipo fichero.
   *
   * Existe para tipar el acceso a `event.target.files`: con `strictTemplates` no se
   * puede escribir `handleFiles($event.target.files)` directamente.
   */
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handleFiles(input.files);
  }

  /** Handles a click on the control's container. */
  onContainerClick(): void {
    // no-op: el componente original tampoco implementa esta acción
  }

  private _resetInputFile(): void {
    this._inputFileRef().nativeElement.value = '';
  }

  private _updateInputValue(files: FileOrArrayFile): void {
    let text: string | null = null;
    if (files) {
      if (Array.isArray(files)) {
        text = this._multiple
          ? files.map((x) => x.name).join(this.separator())
          : files[0].name;
      } else {
        text = files.name != null ? files.name : null;
      }
    }

    // `null` se traduce a cadena vacía: es el comportamiento de `value` en el DOM
    // (`LegacyNullToEmptyString`), idéntico al del componente original.
    this._inputValueRef().nativeElement.value = text ?? '';
  }
}
