import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { RecipeService } from '../recipe/recipe.service';

@Injectable({
  providedIn: 'root'
})
export class RecipeDetailsResolve {
  private service = inject(RecipeService);

  resolve(
    route: ActivatedRouteSnapshot,
  ): Observable<any> | Promise<any> | any {
    return this.service.getRecipeDetail(route.paramMap.get('id'));
  }
}
