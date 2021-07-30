import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RecipeDetailsComponent } from './components/recipe-details/recipe-details.component';
import { NewRecipeComponent } from './components/new-recipe/new-recipe.component';
import { RecipesComponent } from './components/recipes/recipes.component';

export const RecipesRoutingNames = {
  new: 'new',
  details: 'details',
};

const routes: Routes = [
  { path: '', component: RecipesComponent },
  { path: RecipesRoutingNames.new, component: NewRecipeComponent },
  {
    path: `${RecipesRoutingNames.details}/:id`,
    component: RecipeDetailsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecipesRoutingModule {}
