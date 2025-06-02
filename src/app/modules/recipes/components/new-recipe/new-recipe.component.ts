import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppRoutingNames } from 'src/app/app.routes';
import { NgLog } from 'src/app/modules/shared/utils/decorators/log-decorator';
import { RecipesRoutingNames } from '../../recipes.routes';
import { RecipeService } from '../../services/recipe/recipe.service';
import { Recipe } from '../../models/recipes.model';
import { RecipeCardFormComponent } from '../../../shared/components/recipe-card-form/recipe-card-form.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { AnalyticsService } from '../../../shared/services/Analytics/analytics.service';

@NgLog()
@Component({
  selector: 'app-new-recipe',
  templateUrl: './new-recipe.component.html',
  styleUrls: ['./new-recipe.component.scss'],
  standalone: true,
  imports: [ToolbarComponent, RecipeCardFormComponent],
})
export class NewRecipeComponent implements OnInit, OnDestroy {
  private destroy$: Subject<null> = new Subject();

  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private analytics = inject(AnalyticsService);

  ngOnInit(): void {
    this.analytics.sendToAnalytics('new_recipe_component_opened');
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
  }

  createRecipe(recipe: Recipe): void {
    this.analytics.sendToAnalytics('create_recipe_button_clicked');
    this.recipeService
      .createRecipe(recipe)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.goToList());
  }

  private goToList(): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.myRecipes}`,
    ]);
  }
}
