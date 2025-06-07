import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {EMPTY} from 'rxjs';
import {concatMap, switchMap, tap} from 'rxjs/operators';

import {AppRoutingNames} from 'src/app/app.routes';
import {AuthService} from 'src/app/modules/auth/services/auth.service';
import {NgLog} from 'src/app/modules/shared/utils/decorators/log-decorator';
import {Recipe} from '../../models/recipes.model';
import {RecipesRoutingNames} from '../../recipes.routes';
import {RecipeService} from '../../services/recipe/recipe.service';
import {DeleteRecipeDialogComponent} from '../delete-recipe-dialog/delete-recipe-dialog.component';
import {RecipeListComponent} from '../../../shared/components/recipe-list/recipe-list.component';
import {ToolbarComponent} from '../../../shared/components/toolbar/toolbar.component';
import {AnalyticsService} from '../../../shared/services/Analytics/analytics.service';

@NgLog()
@Component({
    selector: 'app-public-recipe-list',
    templateUrl: './public-recipe-list.component.html',
    styleUrls: ['./public-recipe-list.component.scss'],
    imports: [ToolbarComponent, RecipeListComponent]
})
export class PublicRecipeListComponent implements OnInit {
  recipesFiltered: Recipe[] = [];
  userId?: string;

  private recipesRetrieved: Recipe[] = [];

  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private recipeService = inject(RecipeService);
  private authService = inject(AuthService);
  public dialog = inject(MatDialog);
  private analytics = inject(AnalyticsService);

  ngOnInit(): void {
    this.analytics.sendToAnalytics('public_recipes_component_opened');
    this.getRecipes();
    this.listenToLogoutChanges();
    this.userId = this.authService.currentUser?.uid;
  }

  goToRecipe(recipe: Recipe): void {
    if (recipe.id) {
      this.router.navigate([
        `/${AppRoutingNames.recipes}/${RecipesRoutingNames.details}`,
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
          concatMap(() => this.recipeService.getPublicRecipes())
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

  //todo: add test
  cloneRecipe(recipe: Recipe): void {
    this.analytics.sendToAnalytics('public_recipe_cloned', {
      recipeId: recipe.id,
    });

    this.recipeService
      .cloneRecipe(recipe)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((recipeId) => this.goToEditRecipe(recipeId));
  }

  private getRecipes(): void {
    this.recipeService
      .getPublicRecipes()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((data: Recipe[]) => {
          this.recipesFiltered = data;
          this.recipesRetrieved = [...data];
        })
      )
      .subscribe();
  }

  private listenToLogoutChanges(): void {
    this.authService.logoutSuccess$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => (this.userId = undefined)),
        switchMap(() => this.recipeService.getPublicRecipes()),
        tap((data: Recipe[]) => {
          this.recipesFiltered = data;
          this.recipesRetrieved = [...data];
        })
      )
      .subscribe();
  }

  private goToEditRecipe(recipeId: string): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.edit}`,
      recipeId,
    ]);
  }
}
