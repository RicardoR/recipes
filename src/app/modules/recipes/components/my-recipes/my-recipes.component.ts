import { AppRoutingNames } from './../../../../app-routing.module';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, EMPTY } from 'rxjs';
import { takeUntil, concatMap, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { Recipe } from '../../models/recipes.model';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { RecipeService } from '../../services/recipe/recipe.service';
import { DeleteRecipeDialogComponent } from '../delete-recipe-dialog/delete-recipe-dialog.component';
import { NgLog } from 'src/app/modules/shared/utils/decorators/log-decorator';

//@NgLog()
@Component({
  selector: 'app-my-recipes',
  templateUrl: './my-recipes.component.html',
  styleUrls: ['./my-recipes.component.scss'],
})
export class MyRecipesComponent implements OnInit, OnDestroy {
  recipes: Recipe[] = [];
  userId?: string;

  private destroy$: Subject<null> = new Subject();

  constructor(
    private router: Router,
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
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.new}`,
    ]);
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
          switchMap(() => this.recipeService.deleteImage(recipe.imgSrc)),
          concatMap(() => this.recipeService.getOwnRecipes())
        )
        .subscribe((data: Recipe[]) => (this.recipes = data));
    }
  }

  private getRecipes(): void {
    this.recipeService
      .getOwnRecipes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Recipe[]) => this.recipes = data);
  }
}
