import { AuthService } from './../../../auth/services/auth.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutingNames } from 'src/app/app-routing.module';
import { switchMap, take } from 'rxjs/operators';

import { Recipe } from './../../models/recipes.model';
import { RecipeService } from './../../services/recipe/recipe.service';
import { RecipesRoutingNames } from '../../recipes-routing.module';

@Component({
  selector: 'app-recipe-details',
  templateUrl: './recipe-details.component.html',
  styleUrls: ['./recipe-details.component.scss'],
})
export class RecipeDetailsComponent implements OnInit {
  recipeDetails!: Recipe;
  isOwnReceip = false;

  constructor(
    private recipesService: RecipeService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getRecipeDetails();
  }

  goToList(): void {
    this.router.navigate([AppRoutingNames.recipes]);
  }

  deleteRecipe(): void {
    this.recipesService
      .deleteRecipe(this.recipeDetails.id)
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
        take(1),
        switchMap((param) =>
          this.recipesService.getPrivateRecipeDetail(param.id)
        )
      )
      .subscribe((data: Recipe) => {
        this.recipeDetails = data;
        this.isOwnReceip = data.ownerId === this.authService.currentUser?.uid;
      });
  }
}
