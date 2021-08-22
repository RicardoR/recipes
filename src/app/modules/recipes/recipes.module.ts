import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecipesRoutingModule } from './recipes-routing.module';
import { NewRecipeComponent } from './components/new-recipe/new-recipe.component';
import { RecipeListComponent } from './components/recipe-list/recipe-list.component';
import { RecipeService } from './services/recipe/recipe.service';
import { RecipeDetailsComponent } from './components/recipe-details/recipe-details.component';
import { EditRecipeComponent } from './components/edit-recipe/edit-recipe.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RecipesRoutingModule
  ],
  declarations: [
    RecipeListComponent,
    NewRecipeComponent,
    RecipeDetailsComponent,
    EditRecipeComponent
  ],
  providers: [
    RecipeService
  ],
})
export class RecipesModule {}
