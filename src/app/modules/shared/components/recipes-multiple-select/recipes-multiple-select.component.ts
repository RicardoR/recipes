import { filter, takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  ControlValueAccessor,
  UntypedFormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { ElementModel } from '../../../recipes/models/element.model';
import { MatOptionModule } from '@angular/material/core';
import { NgIf, NgFor } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

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
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    NgIf,
    NgFor,
    MatOptionModule,
  ],
})
export class RecipesMultipleSelectComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  @Input() label: string = 'Select';
  @Input() options: ElementModel[] = [];

  private destroy$: Subject<null> = new Subject();

  elementSelectControl = new UntypedFormControl();
  value: ElementModel[] = [];
  touched = false;
  disabled = false;

  onChange = ([]) => {};
  onTouched = () => {};

  ngOnInit(): void {
    this.listenSelectChange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        takeUntil(this.destroy$),
        tap(() => this.markAsTouched()),
        filter((value) => value !== this.value)
      )
      .subscribe((value: ElementModel[]) => {
        this.onChange(value);
      });
  }
}
