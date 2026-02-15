import {ComponentFixture, TestBed} from '@angular/core/testing';
import {vi} from 'vitest';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {recipeMock} from 'src/app/testing-resources/mocks/recipe-mock';
import {RecipeService} from '../../services/recipe/recipe.service';
import {NewRecipeComponent} from './new-recipe.component';
import {AnalyticsService} from '../../../../shared/services/analytics/analytics.service';

describe('NewRecipeComponent', () => {
  let component: NewRecipeComponent;
  let fixture: ComponentFixture<NewRecipeComponent>;
  const recipeServiceSpy = {
    createRecipe: vi.fn().mockName("RecipeService.createRecipe")
  };
  const routeSpy = {
    navigate: vi.fn().mockName("Router.navigate")
  };
  const analyticsSpy = {
    sendToAnalytics: vi.fn().mockName("AnalyticsService.sendToAnalytics")
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NewRecipeComponent],
      providers: [
        {provide: RecipeService, useValue: recipeServiceSpy},
        {provide: Router, useValue: routeSpy},
        {provide: AnalyticsService, useValue: analyticsSpy},
      ],
    }).overrideTemplate(NewRecipeComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewRecipeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('create recipe should create the recipe and then redirect to list', () => {
    recipeServiceSpy.createRecipe.mockReturnValue(of({}));
    component.createRecipe(recipeMock);
    expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('create_recipe_button_clicked');

    expect(recipeServiceSpy.createRecipe).toHaveBeenCalledWith(recipeMock);
    expect(routeSpy.navigate).toHaveBeenCalledWith(['recipes/my-recipes']);
  });

  it('should log new_recipe_component_opened event', () => {
    expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('new_recipe_component_opened');
  });
});
