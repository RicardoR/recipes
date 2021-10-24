import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EditRecipeComponent } from './components/edit-recipe/edit-recipe.component';
import { RecipeDetailsComponent } from './components/recipe-details/recipe-details.component';
import { NewRecipeComponent } from './components/new-recipe/new-recipe.component';
import { RecipeListComponent } from './components/public-recipe-list/public-recipe-list.component';
import { MyRecipesComponent } from './components/my-recipes/my-recipes.component';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PrivateRecipeGuard } from './guards/private-recipe.guard';
import { RecipeDetailsResolve } from './services/resolvers/recipe-details.resolver';

export const RecipesRoutingNames = {
  edit: 'edit',
  new: 'new',
  details: 'details',
  myRecipes: 'my-recipes',
};

const routes: Routes = [
  {
    path: RecipesRoutingNames.myRecipes,
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
    canActivate: [PrivateRecipeGuard],
    resolve: { recipe: RecipeDetailsResolve },
  },
  {
    path: `${RecipesRoutingNames.edit}/:id`,
    component: EditRecipeComponent,
    canActivate: [AuthGuard],
    resolve: { recipe: RecipeDetailsResolve },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecipesRoutingModule {}
