import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipesMultipleSelectComponent } from '../recipes-multiple-select.component';
import { categoriesMock } from 'src/app/__tests__/mocks/categories-mock';
import { ElementModel } from 'src/app/modules/recipes/models/element.model';

describe('RecipesSelectComponent', () => {
  let component: RecipesMultipleSelectComponent;
  let fixture: ComponentFixture<RecipesMultipleSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [RecipesMultipleSelectComponent]
})
    .overrideTemplate(RecipesMultipleSelectComponent, '')
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipesMultipleSelectComponent);
    component = fixture.componentInstance;
    component.options = categoriesMock;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the value in the formcontrol', () => {
    component.value = [];
    component.elementSelectControl.setValue([]);

    component.writeValue([categoriesMock[0]]);

    expect(component.elementSelectControl.value).toEqual([categoriesMock[0]]);
    expect(component.value).toEqual([categoriesMock[0]]);
  });

  it('should compare by id', () => {
    const option: ElementModel = { id: 1, detail: 'test' };
    const optionNew: ElementModel = { id: 90, detail: 'test' };

    const expectedResultOne = component.compareElements(option, categoriesMock[0]);
    const expectedResultTwo = component.compareElements(optionNew, option);

    expect(expectedResultOne).toBe(true);
    expect(expectedResultTwo).toBe(false);
  });
});
