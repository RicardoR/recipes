import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecipesComponent } from './components/recipes.component';
import { RecipesRoutingModule } from './recipes-routing.module';

@NgModule({
  imports: [
    CommonModule,
    RecipesRoutingModule
  ],
  declarations: [RecipesComponent],
})
export class RecipesModule {}
