/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { RecipeService } from './recipe.service';

describe('Service: NewRecipeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecipeService]
    });
  });

  it('should ...', inject([RecipeService], (service: RecipeService) => {
    expect(service).toBeTruthy();
  }));
});
