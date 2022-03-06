import { takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ElementModel } from '../../../recipes/models/element.model';

@Component({
  selector: 'app-recipes-multiple-select',
  templateUrl: './recipes-multiple-select.component.html',
  styleUrls: ['./recipes-multiple-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: RecipesMultipleSelectComponent
    }
  ]
})
export class RecipesMultipleSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() label: string = 'Select';
  @Input() options: ElementModel[] = [];

  private destroy$: Subject<null> = new Subject();

  elementSelectControl = new FormControl();
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
    if(disabled) {
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
        tap(() => this.markAsTouched())
      )
      .subscribe((value: ElementModel[]) => this.onChange(value));
  }
}
