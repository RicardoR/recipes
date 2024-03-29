import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecipesRoutingModule } from './recipes-routing.module';
import { NewRecipeComponent } from './components/new-recipe/new-recipe.component';
import { PublicRecipeListComponent } from './components/public-recipe-list/public-recipe-list.component';
import { RecipeService } from './services/recipe/recipe.service';
import { RecipeDetailsComponent } from './components/recipe-details/recipe-details.component';
import { EditRecipeComponent } from './components/edit-recipe/edit-recipe.component';
import { UtilService } from '../shared/utils/utils.service';

import { DeleteRecipeDialogComponent } from './components/delete-recipe-dialog/delete-recipe-dialog.component';
import { MyRecipesComponent } from './components/my-recipes/my-recipes.component';
import { PrivateRecipeGuard } from './guards/private-recipe.guard';
import { RecipeDetailsResolve } from './services/resolvers/recipe-details.resolver';

@NgModule({
  imports: [
    CommonModule,
    RecipesRoutingModule,
    EditRecipeComponent,
    DeleteRecipeDialogComponent,
    MyRecipesComponent,
    NewRecipeComponent,
    PublicRecipeListComponent,
    RecipeDetailsComponent,
  ],
  providers: [
    PrivateRecipeGuard,
    RecipeDetailsResolve,
    RecipeService,
    UtilService,
  ],
})
export class RecipesModule {}
