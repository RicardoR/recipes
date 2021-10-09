import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Recipe } from './../../../recipes/models/recipes.model';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss'],
})
export class RecipeListComponent {
  @Input() recipes: Recipe[] = [];
  @Input() userId?: string;
  @Output() goToRecipe$: EventEmitter<Recipe> = new EventEmitter();
  @Output() deleteRecipe$: EventEmitter<Recipe> = new EventEmitter();

  goToRecipe(recipe: Recipe) {
    this.goToRecipe$.emit(recipe);
  }

  deleteRecipe(recipe: Recipe) {
    this.deleteRecipe$.emit(recipe);
  }
}
