import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subject } from 'rxjs';
import { concatMap, takeUntil } from 'rxjs/operators';

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
  styleUrls: ['./recipe-details.component.scss'],
})
export class RecipeDetailsComponent implements OnInit, OnDestroy {
  recipeDetails!: Recipe;
  isOwnReceip = false;
  private destroy$: Subject<null> = new Subject();

  constructor(
    private recipesService: RecipeService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getRecipeDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  deleteRecipe(): void {
    const dialogRef = this.dialog.open(DeleteRecipeDialogComponent);

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this.destroy$),
        concatMap((data) =>
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
    if (this.recipeDetails.id) {
      this.router.navigate([
        `${AppRoutingNames.recipes}/${RecipesRoutingNames.edit}`,
        this.recipeDetails.id,
      ]);
    }
  }

  private getRecipeDetails(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.recipeDetails = data.recipe;
        this.isOwnReceip =
          data.recipe.ownerId === this.authService.currentUser?.uid;
      });
  }
}
