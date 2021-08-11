import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { Recipe } from '../../models/recipes.model';
import { RecipeService } from '../../services/recipe/recipe.service';
import { RecipesRoutingNames } from '../../recipes-routing.module';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss'],
})
export class RecipeListComponent implements OnInit {
  recipes: Recipe[] = [];

  constructor(
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private recipeService: RecipeService
  ) { }

  ngOnInit(): void {

    this.recipeService.getOwnRecipes()
      .pipe(take(1))
      .subscribe((data: Recipe[]) => this.recipes = data);
  }

  goToCreate(): void {
    this.route.navigate([RecipesRoutingNames.new], {
      relativeTo: this.activatedRoute,
    });
  }

  goToRecipe(recipe: Recipe) {
    if (recipe.id) {
      this.route.navigate([RecipesRoutingNames.details, recipe.id], {
        relativeTo: this.activatedRoute,
      });
    }
  }
}
