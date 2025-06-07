import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {EMPTY} from 'rxjs';
import {concatMap} from 'rxjs/operators';

import {AuthService} from 'src/app/modules/auth/services/auth.service';
import {Recipe} from '../../models/recipes.model';
import {RecipesRoutingNames} from '../../recipes.routes';
import {RecipeService} from '../../services/recipe/recipe.service';
import {DeleteRecipeDialogComponent} from '../delete-recipe-dialog/delete-recipe-dialog.component';
import {NgLog} from 'src/app/modules/shared/utils/decorators/log-decorator';
import {AppRoutingNames} from '../../../../app.routes';
import {RecipeListComponent} from '../../../shared/components/recipe-list/recipe-list.component';
import {ToolbarComponent} from '../../../shared/components/toolbar/toolbar.component';
import {AnalyticsService} from "../../../shared/services/Analytics/analytics.service";

@NgLog()
@Component({
    selector: 'app-my-recipes',
    templateUrl: './my-recipes.component.html',
    styleUrls: ['./my-recipes.component.scss'],
    imports: [ToolbarComponent, RecipeListComponent]
})
export class MyRecipesComponent implements OnInit {
  recipesFiltered: Recipe[] = [];
  userId?: string;

  private recipesRetrieved: Recipe[] = [];
  private router = inject(Router);
  private recipeService = inject(RecipeService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private analytics = inject(AnalyticsService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.analytics.sendToAnalytics('my_recipes_component_opened');
    this.getRecipes();
    this.userId = this.authService.currentUser?.uid;
  }

  goToRecipe(recipe: Recipe): void {
    if (recipe.id) {
      this.router.navigate([
        `${AppRoutingNames.recipes}/${RecipesRoutingNames.details}`,
        recipe.id,
      ]);
    }
  }

  deleteRecipe(recipe: Recipe): void {
    if (recipe.id) {
      const dialogRef = this.dialog.open(DeleteRecipeDialogComponent);

      dialogRef
        .afterClosed()
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          concatMap((data) =>
            data === true ? this.recipeService.deleteRecipe(recipe.id) : EMPTY
          ),
          concatMap(() => this.recipeService.deleteImage(recipe.imgSrc)),
          concatMap(() => this.recipeService.getOwnRecipes())
        )
        .subscribe((data: Recipe[]) => {
          this.recipesFiltered = data;
          this.recipesRetrieved = [...data];
        });
    }
  }

  onSearchText(searchText: string): void {
    if (searchText?.trim()) {
      this.recipesFiltered = this.recipeService.filterRecipes(
        this.recipesRetrieved,
        searchText
      );
    } else {
      this.recipesFiltered = [...this.recipesRetrieved];
    }
  }

  private getRecipes(): void {
    this.recipeService
      .getOwnRecipes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: Recipe[]) => {
        this.recipesFiltered = data;
        this.recipesRetrieved = [...data];
      });
  }
}
