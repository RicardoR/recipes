import {Routes} from '@angular/router';
import {AuthReadyGuard} from './features/auth/guards/auth-ready.guard';

export const AppRoutingNames = {
  recipes: 'recipes',
  login: 'login',
};

export const APP_ROUTES: Routes = [
  {
    path: AppRoutingNames.recipes,
    canActivate: [AuthReadyGuard],
    loadChildren: () =>
      import('./features/recipes/recipes.routes').then((m) => m.RECIPE_ROUTES),
  },
  {
    path: AppRoutingNames.login,
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: AppRoutingNames.recipes },
];
