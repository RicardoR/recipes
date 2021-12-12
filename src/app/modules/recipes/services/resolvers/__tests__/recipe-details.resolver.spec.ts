import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';

import { RecipeService } from '../../recipe/recipe.service';
import { RecipeDetailsResolve } from '../recipe-details.resolver';
import { Recipe } from './../../../models/recipes.model';

describe('RecipeDetailsResolve', () => {
  let resolver: RecipeDetailsResolve;
  let route: ActivatedRoute;
  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'getRecipeDetail',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecipeDetailsResolve,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'recipeId' }) },
          },
        },
        { provide: RecipeService, useValue: recipeServiceSpy },
      ],
    });
  });

  beforeEach(() => {
     resolver = TestBed.inject(RecipeDetailsResolve);
     route = TestBed.inject(ActivatedRoute);
  });

  it('should resolve to the recipe', () => {
    const routerState = {} as RouterStateSnapshot;
    const recipe = { id: 'recipeId', title: 'test' } as Recipe;

    recipeServiceSpy.getRecipeDetail.and.returnValue(of(recipe));
    resolver.resolve(route.snapshot, routerState);

    expect(recipeServiceSpy.getRecipeDetail).toHaveBeenCalledWith('recipeId');
  });

});
