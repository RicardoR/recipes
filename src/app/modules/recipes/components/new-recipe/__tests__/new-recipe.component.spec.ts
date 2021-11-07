import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { RecipeService } from '../../../services/recipe/recipe.service';
import { NewRecipeComponent } from '../new-recipe.component';
import { recipeMock } from './recipe-mock';

describe('NewRecipeComponent', () => {
  let component: NewRecipeComponent;
  let fixture: ComponentFixture<NewRecipeComponent>;
  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'createRecipe',
  ]);
    const routeSpy = jasmine.createSpyObj('Router', ['navigate']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NewRecipeComponent],
      providers: [
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: Router, useValue: routeSpy },
      ]
    })
    .overrideTemplate(NewRecipeComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewRecipeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('create recipe should create the recipe and then redirect to list', () => {
    recipeServiceSpy.createRecipe.and.returnValue(of({}));
    component.createRecipe(recipeMock);
    expect(recipeServiceSpy.createRecipe).toHaveBeenCalledWith(recipeMock);
    expect(routeSpy.navigate).toHaveBeenCalledWith(['recipes/my-recipes']);
  });
});
