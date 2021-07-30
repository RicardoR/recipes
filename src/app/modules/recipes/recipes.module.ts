import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecipesRoutingModule } from './recipes-routing.module';
import { NewRecipeComponent } from './components/new-recipe/new-recipe.component';
import { RecipesComponent } from './components/recipes/recipes.component';
import { RecipeService } from './services/recipe/recipe.service';
import { RecipeDetailsComponent } from './components/recipe-details/recipe-details.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RecipesRoutingModule
  ],
  declarations: [
    RecipesComponent,
    NewRecipeComponent,
    RecipeDetailsComponent
  ],
  providers: [
    RecipeService
  ],
})
export class RecipesModule {}
