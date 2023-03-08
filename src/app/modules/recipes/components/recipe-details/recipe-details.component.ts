import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, Subject } from 'rxjs';
import { concatMap, map, takeUntil, tap } from 'rxjs/operators';

import { AppRoutingNames } from 'src/app/app-routing.module';
import { NgLog } from 'src/app/modules/shared/utils/decorators/log-decorator';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { DeleteRecipeDialogComponent } from '../delete-recipe-dialog/delete-recipe-dialog.component';
import { AuthService } from './../../../auth/services/auth.service';
import { Recipe } from './../../models/recipes.model';
import { RecipeService } from './../../services/recipe/recipe.service';
@NgLog()
@Component({
  selector: 'app-recipe-details',
  templateUrl: './recipe-details.component.html',
  styleUrls: ['./recipe-details.component.scss']
})
export class RecipeDetailsComponent implements OnInit, OnDestroy {
  recipeDetails$!: Observable<Recipe>;
  isOwnReceip = false;
  currentUserId?: string;

  private destroy$: Subject<null> = new Subject();
  private recipeDetails!: Recipe;

  constructor(
    private recipesService: RecipeService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    public dialog: MatDialog,
    private analytics: AngularFireAnalytics
  ) {
    this.analytics.logEvent('recipe_detail_component_opened');
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUser?.uid;
    this.getRecipeDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  deleteRecipe(): void {
    this.analytics.logEvent('delete_recipe_button_clicked');

    const dialogRef = this.dialog.open(DeleteRecipeDialogComponent);

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this.destroy$),
        concatMap(data =>
          data === true
            ? this.recipesService.deleteRecipe(this.recipeDetails.id)
            : EMPTY
        ),
        concatMap(() =>
          this.recipesService.deleteImage(this.recipeDetails.imgSrc)
        )
      )
      .subscribe(() => this.router.navigate([AppRoutingNames.recipes]));
  }

  editRecipe(): void {
    this.analytics.logEvent('edit_recipe_button_clicked');
    if (this.recipeDetails.id) {
      this.goToEditRecipe(this.recipeDetails.id);
    }
  }

  cloneRecipe(recipe: Recipe): void {
    this.analytics.logEvent('clone_recipe_button_clicked');

    this.recipesService
      .cloneRecipe(recipe)
      .pipe(takeUntil(this.destroy$))
      .subscribe(recipeId => this.goToEditRecipe(recipeId));
  }

  private getRecipeDetails(): void {
    this.recipeDetails$ = this.activatedRoute.data.pipe(
      tap(data => {
        this.isOwnReceip = data.recipe.ownerId === this.currentUserId;
        this.recipeDetails = data.recipe;
      }),
      map(data => data.recipe)
    );
  }

  private goToEditRecipe(recipeId: string): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.edit}`,
      recipeId
    ]);
  }
}
