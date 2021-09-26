import { EditRecipeComponent } from './components/edit-recipe/edit-recipe.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RecipeDetailsComponent } from './components/recipe-details/recipe-details.component';
import { NewRecipeComponent } from './components/new-recipe/new-recipe.component';
import { RecipeListComponent } from './components/public-recipe-list/public-recipe-list.component';
import { MyRecipesComponent } from './components/my-recipes/my-recipes.component';
import { AuthGuard } from '../auth/auth.guard';

export const RecipesRoutingNames = {
  edit: 'edit',
  new: 'new',
  details: 'details',
};

const routes: Routes = [
  {
    path: 'my-recipes',
    component: MyRecipesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '',
    component: RecipeListComponent,
  },
  {
    path: RecipesRoutingNames.new,
    component: NewRecipeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: `${RecipesRoutingNames.details}/:id`,
    component: RecipeDetailsComponent,
  },
  {
    path: `${RecipesRoutingNames.edit}/:id`,
    component: EditRecipeComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecipesRoutingModule {}
