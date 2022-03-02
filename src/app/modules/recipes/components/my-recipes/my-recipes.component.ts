import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { Router } from '@angular/router';
import { Subject, EMPTY } from 'rxjs';
import { takeUntil, concatMap } from 'rxjs/operators';

import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { Recipe } from '../../models/recipes.model';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { RecipeService } from '../../services/recipe/recipe.service';
import { DeleteRecipeDialogComponent } from '../delete-recipe-dialog/delete-recipe-dialog.component';
import { NgLog } from 'src/app/modules/shared/utils/decorators/log-decorator';
import { AppRoutingNames } from './../../../../app-routing.module';

@NgLog()
@Component({
  selector: 'app-my-recipes',
  templateUrl: './my-recipes.component.html',
  styleUrls: ['./my-recipes.component.scss'],
})
export class MyRecipesComponent implements OnInit, OnDestroy {
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
    this.analytics.logEvent('my_recipes_component_opened');
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
          takeUntil(this.destroy$),
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
      this.recipesFiltered = this.recipeService.filterRecipes(this.recipesRetrieved, searchText);
    } else {
      this.recipesFiltered = [...this.recipesRetrieved];
    }
  }

  private getRecipes(): void {
    this.recipeService
      .getOwnRecipes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Recipe[]) => {
        this.recipesFiltered = data;
        this.recipesRetrieved = [...data];
      });
  }
}
