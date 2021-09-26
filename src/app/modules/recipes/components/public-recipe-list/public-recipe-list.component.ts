import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subject } from 'rxjs';
import { concatMap, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { Recipe } from '../../models/recipes.model';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { RecipeService } from '../../services/recipe/recipe.service';
import { DeleteRecipeDialogComponent } from '../delete-recipe-dialog/delete-recipe-dialog.component';

@Component({
  selector: 'app-public-recipe-list',
  templateUrl: './public-recipe-list.component.html',
  styleUrls: ['./public-recipe-list.component.scss'],
})
export class RecipeListComponent implements OnInit, OnDestroy {
  recipes: Recipe[] = [];
  userId?: string;

  private destroy$: Subject<null> = new Subject();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private recipeService: RecipeService,
    private authService: AuthService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getRecipes();
    this.userId = this.authService.currentUser?.uid;
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  goToCreate(): void {
    this.router.navigate([RecipesRoutingNames.new], {
      relativeTo: this.activatedRoute,
    });
  }

  goToRecipe(recipe: Recipe): void {
    if (recipe.id) {
      this.router.navigate([RecipesRoutingNames.details, recipe.id], {
        relativeTo: this.activatedRoute,
      });
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
          switchMap(() => this.recipeService.deleteImage(recipe.imgSrc)),
          concatMap(() => this.recipeService.getOwnRecipes())
        )
        .subscribe((data: Recipe[]) => (this.recipes = data));
    }
  }

  private getRecipes(): void {
    this.recipeService
      .getPublicRecipes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Recipe[]) => (this.recipes = data));
  }
}
