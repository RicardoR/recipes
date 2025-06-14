import {Component, DestroyRef, inject, input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {of} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {AppRoutingNames} from 'src/app/app.routes';
import {MessagesService} from 'src/app/modules/shared/services/messages/messages.service';
import {NgLog} from 'src/app/modules/shared/utils/decorators/log-decorator';
import {Recipe} from '../../models/recipes.model';
import {RecipesRoutingNames} from '../../recipes.routes';
import {RecipeService} from '../../services/recipe/recipe.service';
import {RecipeCardFormComponent} from '../../../shared/components/recipe-card-form/recipe-card-form.component';
import {ToolbarComponent} from '../../../shared/components/toolbar/toolbar.component';
import {AnalyticsService} from '../../../shared/services/Analytics/analytics.service';

@NgLog()
@Component({
  selector: 'app-edit-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.scss'],
  imports: [ToolbarComponent, RecipeCardFormComponent]
})
export class EditRecipeComponent implements OnInit {
  id = input.required<string>()
  recipeDetails!: Recipe;
  isSending = false;

  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private recipesService = inject(RecipeService);
  private messagesService = inject(MessagesService);
  private analytics = inject(AnalyticsService);

  ngOnInit(): void {
    this.analytics.sendToAnalytics('edit_recipe_component_opened')
    this.getRecipeDetails();
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
        takeUntilDestroyed(this.destroyRef),
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
    this.recipesService.getRecipeDetail(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => (this.recipeDetails = data));
  }
}
