import { NewRecipeComponent } from './components/new-recipe/new-recipe.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecipesComponent } from './components/recipes/recipes.component';

export const RecipesRoutingNames = {
  new: 'new'
}

const routes: Routes = [
  { path: '', component: RecipesComponent },
  { path: RecipesRoutingNames.new, component: NewRecipeComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecipesRoutingModule {}
