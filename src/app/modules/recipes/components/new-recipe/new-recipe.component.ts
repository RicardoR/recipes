import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { RecipeService } from '../../services/recipe/recipe.service';
import { AppRoutingNames } from 'src/app/app-routing.module';

@Component({
  selector: 'app-new-recipe',
  templateUrl: './new-recipe.component.html',
  styleUrls: ['./new-recipe.component.scss'],
})
export class NewRecipeComponent implements OnInit {

  constructor(
    private recipeService: RecipeService,
    private route: Router,
  ) {
  }

  ngOnInit(): void {
    //this.recipeService.createRecipe();
  }

  goToList(): void {
    this.route.navigate([AppRoutingNames.recipes]);
  }
}
