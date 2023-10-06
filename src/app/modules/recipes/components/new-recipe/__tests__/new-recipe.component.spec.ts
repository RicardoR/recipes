import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { recipeMock } from 'src/app/testing-resources/mocks/recipe-mock';
import { RecipeService } from '../../../services/recipe/recipe.service';
import { NewRecipeComponent } from '../new-recipe.component';
import { AngularFireTestingModule } from 'src/app/testing-resources/modules/angular-fire-testing.module';

describe('NewRecipeComponent', () => {
  let component: NewRecipeComponent;
  let fixture: ComponentFixture<NewRecipeComponent>;
  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'createRecipe',
  ]);
  const routeSpy = jasmine.createSpyObj('Router', ['navigate']);
  let firebaseAnalycitsSpy: jasmine.SpyObj<any>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NewRecipeComponent, AngularFireTestingModule],
      providers: [
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: Router, useValue: routeSpy },
      ],
    }).overrideTemplate(NewRecipeComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewRecipeComponent);
    component = fixture.componentInstance;
    firebaseAnalycitsSpy =
      AngularFireTestingModule.getAngularFireAnalyticsSpy();
    fixture.detectChanges();
  });

  it('create recipe should create the recipe and then redirect to list', () => {
    recipeServiceSpy.createRecipe.and.returnValue(of({}));
    component.createRecipe(recipeMock);
    expect(firebaseAnalycitsSpy).toHaveBeenCalledWith(
      'create_recipe_button_clicked'
    );

    expect(recipeServiceSpy.createRecipe).toHaveBeenCalledWith(recipeMock);
    expect(routeSpy.navigate).toHaveBeenCalledWith(['recipes/my-recipes']);
  });

  it('should log new_recipe_component_opened event', () => {
    expect(firebaseAnalycitsSpy).toHaveBeenCalledWith(
      'new_recipe_component_opened'
    );
  });
});
