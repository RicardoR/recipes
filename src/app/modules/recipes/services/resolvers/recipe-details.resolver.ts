import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { RecipeService } from '../recipe/recipe.service';

@Injectable({
  providedIn: 'root'
})
export class RecipeDetailsResolve {
  constructor(private service: RecipeService) {}

  resolve(
    route: ActivatedRouteSnapshot,
  ): Observable<any> | Promise<any> | any {
    return this.service.getRecipeDetail(route.paramMap.get('id'));
  }
}
