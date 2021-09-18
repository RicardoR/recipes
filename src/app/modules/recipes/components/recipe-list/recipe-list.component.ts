import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { Recipe } from '../../models/recipes.model';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { RecipeService } from '../../services/recipe/recipe.service';


@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss'],
})
export class RecipeListComponent implements OnInit, OnDestroy {
  recipes: Recipe[] = [];
  userId?: string;

  private destroy$: Subject<null> = new Subject();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private recipeService: RecipeService,
    private authService: AuthService
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
      this.recipeService
        .deleteRecipe(recipe.id)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => this.recipeService.deleteImage(recipe.imgSrc))
        )
        .subscribe(() => this.getRecipes());
    }
  }

  private getRecipes(): void {
    this.recipeService
      .getOwnRecipes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Recipe[]) => (this.recipes = data));
  }
}
