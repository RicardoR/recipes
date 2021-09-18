import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { AppRoutingNames } from 'src/app/app-routing.module';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { AuthService } from './../../../auth/services/auth.service';
import { Recipe } from './../../models/recipes.model';
import { RecipeService } from './../../services/recipe/recipe.service';

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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getRecipeDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  goToList(): void {
    this.router.navigate([AppRoutingNames.recipes]);
  }

  deleteRecipe(): void {
    this.recipesService
      .deleteRecipe(this.recipeDetails.id)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>this.recipesService.deleteImage(this.recipeDetails.imgSrc))
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
    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((param) => this.recipesService.getPrivateRecipeDetail(param.id))
      )
      .subscribe((data: Recipe) => {
        this.recipeDetails = data;
        this.isOwnReceip = data.ownerId === this.authService.currentUser?.uid;
      });
  }
}
