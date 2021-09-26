import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


export const AppRoutingNames = {
  recipes: 'recipes',
  login: 'login'
}

const routes: Routes = [
  {
    path: AppRoutingNames.recipes,
    loadChildren: () =>
      import('./modules/recipes/recipes.module').then((m) => m.RecipesModule)
  },
  {
    path: AppRoutingNames.login,
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
