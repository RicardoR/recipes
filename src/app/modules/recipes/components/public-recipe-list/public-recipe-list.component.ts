import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EMPTY, Subject } from 'rxjs';
import { concatMap, takeUntil, switchMap, tap } from 'rxjs/operators';

import { AppRoutingNames } from 'src/app/app-routing.module';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { NgLog } from 'src/app/modules/shared/utils/decorators/log-decorator';
import { Recipe } from '../../models/recipes.model';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { RecipeService } from '../../services/recipe/recipe.service';
import { DeleteRecipeDialogComponent } from '../delete-recipe-dialog/delete-recipe-dialog.component';

@NgLog()
@Component({
  selector: 'app-public-recipe-list',
  templateUrl: './public-recipe-list.component.html',
  styleUrls: ['./public-recipe-list.component.scss']
})
export class PublicRecipeListComponent implements OnInit, OnDestroy {
  recipesFiltered: Recipe[] = [];
  userId?: string;

  private destroy$: Subject<null> = new Subject();
  private recipesRetrieved: Recipe[] = [];

  constructor(
    private router: Router,
    private recipeService: RecipeService,
    private authService: AuthService,
    public dialog: MatDialog,
    private analytics: AngularFireAnalytics
  ) {
    this.analytics.logEvent('public_recipes_component_opened');
  }

  ngOnInit(): void {
    this.getRecipes();
    this.listenToLogoutChanges();
    this.userId = this.authService.currentUser?.uid;
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  goToRecipe(recipe: Recipe): void {
    if (recipe.id) {
      this.router.navigate([
        `/${AppRoutingNames.recipes}/${RecipesRoutingNames.details}`,
        recipe.id
      ]);
    }
  }

  deleteRecipe(recipe: Recipe): void {
    if (recipe.id) {
      const dialogRef = this.dialog.open(DeleteRecipeDialogComponent);

      dialogRef
        .afterClosed()
        .pipe(
          takeUntil(this.destroy$),
          concatMap(data =>
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

  cloneRecipe(recipe: Recipe): void {
    this.analytics.logEvent('public_recipe_cloned', {
      recipeId: recipe.id
    });

    this.recipeService
      .cloneRecipe(recipe)
      .pipe(takeUntil(this.destroy$))
      .subscribe(recipeId => this.goToEditRecipe(recipeId));
  }

  private getRecipes(): void {
    this.recipeService
      .getPublicRecipes()
      .pipe(
        takeUntil(this.destroy$),
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
        takeUntil(this.destroy$),
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
      recipeId
    ]);
  }
}
