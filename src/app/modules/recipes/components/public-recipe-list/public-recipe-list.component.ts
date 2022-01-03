import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EMPTY, Subject } from 'rxjs';
import { concatMap, takeUntil } from 'rxjs/operators';

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
  styleUrls: ['./public-recipe-list.component.scss'],
})
export class PublicRecipeListComponent implements OnInit, OnDestroy {
  recipes: Recipe[] = [];
  userId?: string;

  private destroy$: Subject<null> = new Subject();

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
          takeUntil(this.destroy$),
          concatMap((data) =>
            data === true ? this.recipeService.deleteRecipe(recipe.id) : EMPTY
          ),
          concatMap(() => this.recipeService.deleteImage(recipe.imgSrc)),
          concatMap(() => this.recipeService.getPublicRecipes())
        )
        .subscribe((data: Recipe[]) => (this.recipes = data));
    }
  }

  private getRecipes(): void {
    // todo: add resolver for this
    this.recipeService
      .getPublicRecipes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Recipe[]) => (this.recipes = data));
  }
}
