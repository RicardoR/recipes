import {
  booleanAttribute,
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
  SimpleChanges,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import {ControlValueAccessor, NgControl, NgForm} from '@angular/forms';
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
  imports: [MatIconModule, MatButtonModule],
})
export class FileInputComponent
  implements
    MatFormFieldControl<FileOrArrayFile>,
    ControlValueAccessor,
    DoCheck,
    OnChanges,
    OnDestroy {
  readonly ngControl = inject(NgControl, {optional: true, self: true});
  private readonly parentForm = inject(NgForm, {optional: true});
  private readonly defaultErrorStateMatcher = inject(ErrorStateMatcher);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private readonly fileInputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly displayInputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('displayInput');

  // ── Inputs del contrato de MatFormFieldControl ──────────────────────────
  // El mat-form-field los lee como valores planos, así que no pueden ser signals.
  @Input() id = `app-file-input-${nextUniqueId++}`;
  @Input() placeholder = 'Choose a file';
  @Input({transform: booleanAttribute}) required = false;
  @Input({transform: booleanAttribute}) disabled = false;
  @Input() value: FileOrArrayFile | null = null;

  // ── Inputs ───────────────────────────────────────────────────────────────
  readonly accept = input<string>();
  readonly multiple = input(false, {transform: booleanAttribute});
  readonly readonly = input(true, {transform: booleanAttribute});
  readonly color = input<ThemePalette>('primary');
  readonly separator = input(',');
  readonly errorStateMatcher = input<ErrorStateMatcher>();

  // ── Estado ───────────────────────────────────────────────────────────────
  readonly stateChanges = new Subject<void>();
  focused = false;
  errorState = false;
  controlType = 'app-file-input';
  ariaDescribedby = '';

  private onChange?: (value: FileOrArrayFile) => void;
  private onTouched?: () => void;

  constructor() {
    // El control se conecta al formulario a través del NgControl, igual que
    // hace MatSelect en Material. Usar el token NG_VALUE_ACCESSOR provocaría
    // una dependencia circular: el FormControlDirective nos necesita a nosotros.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  // ── Ciclo de vida ────────────────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled']) {
      this.focused = false;
    }
    // El mat-form-field debe recalcular su estado cuando cambia un input.
    this.stateChanges.next();
  }

  ngDoCheck(): void {
    this.updateErrorState();
  }

  ngOnDestroy(): void {
    this.stateChanges.complete();
  }

  // ── Contrato de MatFormFieldControl ──────────────────────────────────────
  get empty(): boolean {
    return !this.displayInputRef().nativeElement.value && !this.isBadInput();
  }

  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  updateErrorState(): void {
    const matcher = this.errorStateMatcher() ?? this.defaultErrorStateMatcher;
    const errorState = matcher.isErrorState(
      this.ngControl?.control ?? null,
      this.parentForm
    );

    if (errorState !== this.errorState) {
      this.errorState = errorState;
      this.stateChanges.next();
    }
  }

  setDescribedByIds(ids: string[]): void {
    this.ariaDescribedby = ids.join(' ');
  }

  onContainerClick(): void {
    // El mat-form-field notifica la pulsación sobre su contenedor; no hay nada que hacer.
  }

  focus(options?: FocusOptions): void {
    this.displayInputRef().nativeElement.focus(options);
  }

  // ── ControlValueAccessor ─────────────────────────────────────────────────
  writeValue(value: FileOrArrayFile | null): void {
    this.value = value;
    this.updateDisplayedValue(value);
  }

  registerOnChange(fn: (value: FileOrArrayFile) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.focused = false;
    this.stateChanges.next();
  }

  // ── Selección de fichero ─────────────────────────────────────────────────
  openFilePicker(event?: MouseEvent): void {
    this.fileInputRef().nativeElement.click();
    event?.preventDefault();
    event?.stopPropagation();
    this.markAsTouched();
  }

  onFileChange(event: Event): void {
    this.handleFiles((event.target as HTMLInputElement).files);
  }

  handleFiles(fileList: FileList | null): void {
    if (!fileList?.length) {
      return;
    }

    const files = Array.from(fileList);
    this.updateDisplayedValue(files);

    // Vacía el input para poder volver a seleccionar el mismo fichero.
    this.fileInputRef().nativeElement.value = '';

    this.onChange?.(this.multiple() ? files : files[0]);
  }

  // ── Internos ────────────────────────────────────────────────────────────
  private markAsTouched(): void {
    this.onTouched?.();
    this.changeDetectorRef.markForCheck();
    this.stateChanges.next();
  }

  private isBadInput(): boolean {
    return this.displayInputRef().nativeElement.validity.badInput;
  }

  private updateDisplayedValue(files: FileOrArrayFile | File[] | null): void {
    if (!files) {
      this.displayInputRef().nativeElement.value = '';
      return;
    }

    const names = Array.isArray(files)
      ? files.map((file) => file.name)
      : [files.name];

    this.displayInputRef().nativeElement.value = this.multiple()
      ? names.join(this.separator())
      : (names[0] ?? '');
  }
}
