import {Routes} from '@angular/router';

import {EditRecipeComponent} from './components/edit-recipe/edit-recipe.component';
import {RecipeDetailsComponent} from './components/recipe-details/recipe-details.component';
import {NewRecipeComponent} from './components/new-recipe/new-recipe.component';
import {PublicRecipeListComponent} from './components/public-recipe-list/public-recipe-list.component';
import {MyRecipesComponent} from './components/my-recipes/my-recipes.component';
import {AuthGuard} from '../auth/guards/auth.guard';
import {PrivateRecipeGuard} from './guards/private-recipe.guard';

export const RecipesRoutingNames = {
  edit: 'edit',
  new: 'new',
  details: 'details',
  myRecipes: 'my-recipes',
};

export const RECIPE_ROUTES: Routes = [
  {
    path: RecipesRoutingNames.myRecipes,
    component: MyRecipesComponent,
    data: {title: 'Listado de recetas', displaySearchButton: true },
    canActivate: [AuthGuard],
  },
  {
    path: '',
    component: PublicRecipeListComponent,
    data: {title: 'Listado de recetas', displaySearchButton: true},
  },
  {
    path: RecipesRoutingNames.new,
    component: NewRecipeComponent,
    data: {title: 'Crear receta'},
    canActivate: [AuthGuard],
  },
  {
    path: `${RecipesRoutingNames.details}/:id`,
    component: RecipeDetailsComponent,
    data: {title: 'Detalles' },
    canActivate: [PrivateRecipeGuard],
  },
  {
    path: `${RecipesRoutingNames.edit}/:id`,
    component: EditRecipeComponent,
    data: {title: 'Editar receta'},
    canActivate: [AuthGuard],
  },
];

