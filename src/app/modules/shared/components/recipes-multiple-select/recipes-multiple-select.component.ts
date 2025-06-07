import {filter, tap} from 'rxjs/operators';
import {ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnInit,} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, UntypedFormControl,} from '@angular/forms';
import {MatOptionModule} from '@angular/material/core';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {ElementModel} from '../../../recipes/models/element.model';

@Component({
    selector: 'app-recipes-multiple-select',
    templateUrl: './recipes-multiple-select.component.html',
    styleUrls: ['./recipes-multiple-select.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: RecipesMultipleSelectComponent,
        },
    ],
    imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatOptionModule
]
})
export class RecipesMultipleSelectComponent implements ControlValueAccessor, OnInit
{
  @Input() label: string = 'Select';
  @Input() options: ElementModel[] = [];

  private destroyRef = inject(DestroyRef);

  elementSelectControl = new UntypedFormControl();
  value: ElementModel[] = [];
  touched = false;
  disabled = false;

  onChange = ([]) => {};
  onTouched = () => {};

  ngOnInit(): void {
    this.listenSelectChange();
  }

  writeValue(value: ElementModel[]): void {
    this.value = value;
    this.elementSelectControl.setValue(value);
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any): void {
    this.onTouched = onTouched;
  }

  markAsTouched(): void {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    if (disabled) {
      this.elementSelectControl.disable();
    } else {
      this.elementSelectControl.enable();
    }
  }

  compareElements(elementOne: ElementModel, elementTwo: ElementModel): boolean {
    return elementOne?.id === elementTwo?.id;
  }

  private listenSelectChange(): void {
    this.elementSelectControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markAsTouched()),
        filter((value) => value !== this.value)
      )
      .subscribe((value: ElementModel[]) => {
        this.onChange(value);
      });
  }
}
