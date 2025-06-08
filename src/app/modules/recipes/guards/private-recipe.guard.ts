import { take } from 'rxjs/operators';
import { Recipe } from 'src/app/modules/recipes/models/recipes.model';
import { RecipeService } from 'src/app/modules/recipes/services/recipe/recipe.service';
import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, ReplaySubject } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { MessagesService } from '../../shared/services/messages/messages.service';

@Injectable({
  providedIn: 'root',
})
export class PrivateRecipeGuard {
  private recipesService = inject(RecipeService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messagesService = inject(MessagesService);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const recipeId = route.params['id'];
    const userId = this.authService.currentUser?.uid;
    const canActivate = new ReplaySubject<boolean>();
    this.recipesService
      .getRecipeDetail(recipeId)
      .pipe(take(1))
      .subscribe((recipe: Recipe) => {
        if (!recipe.private || recipe.ownerId === userId) {
          canActivate.next(true);
        } else {
          this.router.navigate(['/recipes']);
          canActivate.next(false);
          this.messagesService.showSnackBar(
            'No estás autorizado para ver esta receta'
          );
        }
      });

    return canActivate;
  }
}
