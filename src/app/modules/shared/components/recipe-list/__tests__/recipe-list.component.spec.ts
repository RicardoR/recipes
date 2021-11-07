import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeListComponent } from '../recipe-list.component';
import { recipeMock } from './recipe-mock';

describe('RecipeListComponent', () => {
  let component: RecipeListComponent;
  let fixture: ComponentFixture<RecipeListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ RecipeListComponent ]
    })
    .overrideTemplate(RecipeListComponent, '')
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('goToRecipe should emit the action to navigate', () => {
    const goToRecipeSpy = spyOn(component.goToRecipe$, 'emit');
    component.goToRecipe(recipeMock);
    expect(goToRecipeSpy).toHaveBeenCalledWith(recipeMock);
  });

  it('deleteRecipe should emit the action to delete a recipe', () => {
    const deteRecipeSpy = spyOn(component.deleteRecipe$, 'emit');
    component.deleteRecipe(recipeMock);
    expect(deteRecipeSpy).toHaveBeenCalledWith(recipeMock);
  });
});
