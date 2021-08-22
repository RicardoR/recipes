import { EditRecipeComponent } from './components/edit-recipe/edit-recipe.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RecipeDetailsComponent } from './components/recipe-details/recipe-details.component';
import { NewRecipeComponent } from './components/new-recipe/new-recipe.component';
import { RecipeListComponent } from './components/recipe-list/recipe-list.component';

export const RecipesRoutingNames = {
  edit: 'edit',
  new: 'new',
  details: 'details',
};

const routes: Routes = [
  {
    path: '',
    component: RecipeListComponent
  },
  {
    path: RecipesRoutingNames.new,
    component: NewRecipeComponent
  },
  {
    path: `${RecipesRoutingNames.details}/:id`,
    component: RecipeDetailsComponent,
  },
  {
    path: `${RecipesRoutingNames.edit}/:id`,
    component: EditRecipeComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecipesRoutingModule {}
