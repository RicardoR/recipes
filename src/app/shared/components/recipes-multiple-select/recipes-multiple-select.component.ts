/* eslint-disable @typescript-eslint/no-empty-function */

import {ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, input} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl} from '@angular/forms';
import {MatOptionModule} from '@angular/material/core';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {computed, signal} from '@angular/core';
import {filter, tap} from 'rxjs/operators';
import {ElementModel} from '../../../features/recipes/models/element.model';


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
  readonly label = input<string>('Select');
  readonly options = input<ElementModel[]>([]);

  private destroyRef = inject(DestroyRef);

  elementSelectControl = new FormControl<ElementModel[] | null>(null);
  value: ElementModel[] = [];
  touched = false;
  disabled = false;

  selectedDetail = computed(() => {
    const value = this.elementSelectValue();
    if (value && value.length > 0 && value[0]) {
      return value[0].detail;
    }
    return '';
  });

  selectedCountText = computed(() => {
    const value = this.elementSelectValue();
    if (value && value.length > 1) {
      return `(+${value.length - 1} ${value.length === 2 ? 'otro' : 'otros'})`;
    }
    return '';
  });

  onChange: (value: ElementModel[]) => void = () => {};
  onTouched: () => void = () => {};

  elementSelectValue = signal<ElementModel[] | null>(this.elementSelectControl.value);

  ngOnInit(): void {
    this.listenSelectChange();
    this.elementSelectControl.valueChanges.subscribe(value => {
      this.elementSelectValue.set(value);
    });
  }

  writeValue(value: ElementModel[]): void {
    this.value = value;
    this.elementSelectControl.setValue(value);
  }

  registerOnChange(onChange: (value: unknown) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
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
        filter((value) => value !== null),
        filter((value) => value !== this.value)
      )
      .subscribe((value: ElementModel[]) => {
        this.onChange(value);
      });
  }
}
