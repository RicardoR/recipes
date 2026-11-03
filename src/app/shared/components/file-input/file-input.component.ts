import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  DoCheck,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  OnChanges,
  OnDestroy,
  viewChild
} from '@angular/core';
import {ControlValueAccessor, NgControl, NgForm} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {ErrorStateMatcher, ThemePalette} from '@angular/material/core';
import {MatFormFieldControl} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Subject} from 'rxjs';

import {FileOrArrayFile} from './file-input.types';

let nextUniqueId = 0;

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss'],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: forwardRef(() => FileInputComponent),
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private statusChangesSubscribed = false;

  private readonly fileInputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly displayInputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('displayInput');

  readonly id = `app-file-input-${nextUniqueId++}`;
  readonly placeholder = input('Choose a file');
  readonly required = input(false, {transform: booleanAttribute});
  readonly disabled = model(false);
  readonly value = model<FileOrArrayFile | null>(null);
  readonly accept = input<string>();
  readonly multiple = input(false, {transform: booleanAttribute});
  readonly readonly = input(true, {transform: booleanAttribute});
  readonly color = input<ThemePalette>('primary');
  readonly separator = input(',');
  readonly errorStateMatcher = input<ErrorStateMatcher>();

  readonly stateChanges = new Subject<void>();
  focused = false;
  errorState = false;
  controlType = 'app-file-input';
  ariaDescribedby = '';

  private onChange?: (value: FileOrArrayFile) => void;
  private onTouched?: () => void;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnChanges(): void {
    this.stateChanges.next();
  }

  ngDoCheck(): void {
    this.subscribeToStatusChanges();
    this.updateErrorState();
  }

  ngOnDestroy(): void {
    this.stateChanges.complete();
  }

  get empty(): boolean {
    return !this.displayInputRef().nativeElement.value;
  }

  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  setDescribedByIds(ids: string[]): void {
    this.ariaDescribedby = ids.join(' ');
  }

  onContainerClick(): void {
    this.displayInputRef().nativeElement.focus();
  }

  focus(options?: FocusOptions): void {
    this.displayInputRef().nativeElement.focus(options);
  }

  writeValue(value: FileOrArrayFile | null): void {
    this.value.set(value);
    this.updateDisplayedValue(value);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: FileOrArrayFile) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    this.stateChanges.next();
    this.cdr.markForCheck();
  }

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
    this.fileInputRef().nativeElement.value = '';

    const value = this.multiple() ? files : files[0];
    this.value.set(value);
    this.onChange?.(value);
    this.cdr.markForCheck();
  }

  private markAsTouched(): void {
    this.onTouched?.();
    this.stateChanges.next();
  }

  private subscribeToStatusChanges(): void {
    const control = this.ngControl?.control;
    if (this.statusChangesSubscribed || !control) {
      return;
    }
    this.statusChangesSubscribed = true;
    control.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateErrorState();
        this.cdr.markForCheck();
      });
  }

  private updateErrorState(): void {
    const matcher = this.errorStateMatcher() ?? this.defaultErrorStateMatcher;
    const errorState = matcher.isErrorState(
      this.ngControl?.control ?? null,
      this.parentForm
    );

    if (errorState !== this.errorState) {
      this.errorState = errorState;
      this.stateChanges.next();
      this.cdr.markForCheck();
    }
  }

  private updateDisplayedValue(files: FileOrArrayFile | null): void {
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
