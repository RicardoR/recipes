import { take } from 'rxjs/operators';
import { Recipe } from 'src/app/modules/recipes/models/recipes.model';
import { RecipeService } from 'src/app/modules/recipes/services/recipe/recipe.service';
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
} from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';


@Injectable()
export class PrivateRecipeGuard implements CanActivate {
  constructor(
    private recipesService: RecipeService,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const recipeId = route.params['id'];
    const userId = this.authService.currentUser?.uid;
    const canActivate = new Subject<boolean>();

    this.recipesService
      .getPrivateRecipeDetail(recipeId)
      .pipe(take(1))
      .subscribe((recipe: Recipe) => {
        if (recipe.private === false) {
          canActivate.next(true);
        } else {
          canActivate.next(recipe.ownerId === userId);
        }
      });

    return canActivate;
  }
}
