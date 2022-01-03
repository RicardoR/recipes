import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { AppRoutingNames } from 'src/app/app-routing.module';
import { MessagesService } from 'src/app/modules/shared/services/messages/messages.service';
import { NgLog } from 'src/app/modules/shared/utils/decorators/log-decorator';
import { Recipe } from '../../models/recipes.model';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { RecipeService } from '../../services/recipe/recipe.service';

@NgLog()
@Component({
  selector: 'app-edit-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.scss'],
})
export class EditRecipeComponent implements OnInit, OnDestroy {
  recipeDetails!: Recipe;
  isSending = false;
  private destroy$: Subject<null> = new Subject();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private recipesService: RecipeService,
    private messagesService: MessagesService,
    private analytics: AngularFireAnalytics
  ) {
    this.analytics.logEvent('edit_recipe_component_opened');
  }

  ngOnInit(): void {
    this.getRecipeDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  goToList(): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.myRecipes}`,
    ]);
  }

  goToRecipe(): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.details}`,
      this.recipeDetails.id,
    ]);
  }

  updateRecipe(recipe: Recipe): void {
    this.analytics.logEvent('update_recipe_button_clicked');

    this.isSending = true;
    this.recipesService
      .updateRecipe(recipe)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          if (this.recipeDetails.imgSrc !== recipe.imgSrc) {
            return this.recipesService.deleteImage(this.recipeDetails.imgSrc);
          }
          return of({});
        })
      )
      .subscribe(() => {
        this.messagesService.showSnackBar('Receta actualizada');
        this.isSending = false;
      });
  }

  private getRecipeDetails(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.recipeDetails = data.recipe));
  }
}
