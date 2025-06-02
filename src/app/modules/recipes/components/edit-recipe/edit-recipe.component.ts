import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { AppRoutingNames } from 'src/app/app.routes';
import { MessagesService } from 'src/app/modules/shared/services/messages/messages.service';
import { NgLog } from 'src/app/modules/shared/utils/decorators/log-decorator';
import { Recipe } from '../../models/recipes.model';
import { RecipesRoutingNames } from '../../recipes.routes';
import { RecipeService } from '../../services/recipe/recipe.service';
import { RecipeCardFormComponent } from '../../../shared/components/recipe-card-form/recipe-card-form.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { AnalyticsService } from "../../../shared/services/Analytics/analytics.service";

@NgLog()
@Component({
  selector: 'app-edit-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.scss'],
  standalone: true,
  imports: [ToolbarComponent, RecipeCardFormComponent],
})
export class EditRecipeComponent implements OnInit, OnDestroy {
  recipeDetails!: Recipe;
  isSending = false;
  private destroy$: Subject<null> = new Subject();
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private recipesService = inject(RecipeService);
  private messagesService = inject(MessagesService);
  private analytics = inject(AnalyticsService);

  ngOnInit(): void {
    this.analytics.sendToAnalytics('edit_recipe_component_opened')
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
    this.analytics.sendToAnalytics('update_recipe_button_clicked');

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
