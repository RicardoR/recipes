import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthReadyGuard } from './modules/auth/guards/auth-ready.guard';


export const AppRoutingNames = {
  recipes: 'recipes',
  login: 'login'
}

const routes: Routes = [
  {
    path: AppRoutingNames.recipes,
    canActivate: [AuthReadyGuard],
    loadChildren: () =>
      import('./modules/recipes/recipes.module').then((m) => m.RecipesModule),
  },
  {
    path: AppRoutingNames.login,
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  { path: '**', redirectTo: AppRoutingNames.recipes },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
