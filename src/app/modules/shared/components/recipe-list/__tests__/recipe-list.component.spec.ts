import { recipesListMock } from 'src/app/__tests__/mocks/recipes-list-mock';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RecipeService } from 'src/app/modules/recipes/services/recipe/recipe.service';
import { categoriesMock } from 'src/app/__tests__/mocks/categories-mock';
import { recipeMock } from 'src/app/__tests__/mocks/recipe-mock';

import { RecipeListComponent } from '../recipe-list.component';

describe('RecipeListComponent', () => {
  let component: RecipeListComponent;
  let fixture: ComponentFixture<RecipeListComponent>;

  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'getCategories'
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecipeListComponent],
      providers: [{ provide: RecipeService, useValue: recipeServiceSpy }]
    }).overrideTemplate(RecipeListComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeListComponent);
    component = fixture.componentInstance;
    component.recipes = recipesListMock;
    recipeServiceSpy.getCategories.and.returnValue(of(categoriesMock));
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

  it('should retrieve the categories', () => {
    expect(recipeServiceSpy.getCategories).toHaveBeenCalled();
    expect(component.categories).toEqual(categoriesMock);
  });

  describe('filter', () => {
    it('should return all recipes when filter is empty', () => {
      expect(component.recipesFiltered).toEqual(recipesListMock);
      component.categoryFilter.patchValue([]);
      expect(component.recipesFiltered).toEqual(recipesListMock);
    });

    it('should filter by one category', () => {
      expect(component.recipesFiltered).toEqual(recipesListMock);
      component.categoryFilter.patchValue([categoriesMock[0]]);
      expect(component.recipesFiltered).toEqual([recipesListMock[0]]);
    });

    it('should filter by more than one category', () => {
      expect(component.recipesFiltered).toEqual(recipesListMock);
      component.categoryFilter.patchValue(categoriesMock);
      expect(component.recipesFiltered).toEqual(recipesListMock);
    });

    it('should return an emtpy array when category selected doesnt exists in the recipes', () => {
      expect(component.recipesFiltered).toEqual(recipesListMock);
      component.categoryFilter.patchValue([{ id: -1, detail: 'test' }]);
      expect(component.recipesFiltered).toEqual([]);
    });
  });
});
