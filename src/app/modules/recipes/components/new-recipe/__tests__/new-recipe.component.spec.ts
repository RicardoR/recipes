import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { recipeMock } from 'src/app/__tests__/mocks/recipe-mock';
import { RecipeService } from '../../../services/recipe/recipe.service';
import { NewRecipeComponent } from '../new-recipe.component';

describe('NewRecipeComponent', () => {
  let component: NewRecipeComponent;
  let fixture: ComponentFixture<NewRecipeComponent>;
  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'createRecipe',
  ]);
  const routeSpy = jasmine.createSpyObj('Router', ['navigate']);
  const firebaseAnalycitsSpy = jasmine.createSpyObj('AngularFireAnalytics', [
    'logEvent',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [NewRecipeComponent],
    providers: [
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: Router, useValue: routeSpy },
        { provide: AngularFireAnalytics, useValue: firebaseAnalycitsSpy },
    ],
}).overrideTemplate(NewRecipeComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewRecipeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('create recipe should create the recipe and then redirect to list', () => {
    recipeServiceSpy.createRecipe.and.returnValue(of({}));
    component.createRecipe(recipeMock);
    expect(firebaseAnalycitsSpy.logEvent).toHaveBeenCalledWith('create_recipe_button_clicked');

    expect(recipeServiceSpy.createRecipe).toHaveBeenCalledWith(recipeMock);
    expect(routeSpy.navigate).toHaveBeenCalledWith(['recipes/my-recipes']);
  });

  it('should log new_recipe_component_opened event', () => {
    expect(firebaseAnalycitsSpy.logEvent).toHaveBeenCalledWith('new_recipe_component_opened');
  });
});
