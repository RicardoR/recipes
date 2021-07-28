import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../../services/recipe/recipe.service';

@Component({
  selector: 'app-new-recipe',
  templateUrl: './new-recipe.component.html',
  styleUrls: ['./new-recipe.component.scss']
})
export class NewRecipeComponent implements OnInit {

  constructor(private recipeService: RecipeService) { }

  ngOnInit(): void {
    this.recipeService.createRecipe();
  }

}
