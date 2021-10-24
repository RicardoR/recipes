import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { Recipe } from '../../models/recipes.model';
import { RecipeService } from '../recipe/recipe.service';

@Injectable()
export class RecipeDetailsResolve implements Resolve<Recipe> {
  constructor(private service: RecipeService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    return this.service.getRecipeDetail(route.paramMap.get('id'));
  }
}
