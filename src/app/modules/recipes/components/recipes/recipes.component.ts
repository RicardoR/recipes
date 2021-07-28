import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { Recipe } from './../../models/recipes.model';
import { RecipeService } from '../../services/recipe/recipe.service';
import { RecipesRoutingNames } from '../../recipes-routing.module';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss'],
})
export class RecipesComponent implements OnInit {
  recipes: Recipe[] = [];

  constructor(
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private recipeService: RecipeService
  ) { }

  ngOnInit(): void {

    // todo: change take 1 for another strategy
    this.recipeService.getRecipes()
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
