/* eslint-disable @typescript-eslint/no-empty-function */
import {
  booleanAttribute,
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
  ChangeDetectionStrategy
} from '@angular/core';
import {ControlValueAccessor, NgControl, NgForm} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {ErrorStateMatcher, ThemePalette} from '@angular/material/core';
import {MatFormFieldControl} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
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
  changeDetection: ChangeDetectionStrategy.Eager,
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

  private readonly fileInputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly displayInputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('displayInput');

  @Input() id = `app-file-input-${nextUniqueId++}`;
  @Input() placeholder = 'Choose a file';
  @Input({transform: booleanAttribute}) required = false;
  @Input({transform: booleanAttribute}) disabled = false;
  @Input() value: FileOrArrayFile | null = null;

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

  onContainerClick(): void {}

  focus(options?: FocusOptions): void {
    this.displayInputRef().nativeElement.focus(options);
  }

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
    this.stateChanges.next();
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
    this.value = value;
    this.onChange?.(value);
  }

  private markAsTouched(): void {
    this.onTouched?.();
    this.stateChanges.next();
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
