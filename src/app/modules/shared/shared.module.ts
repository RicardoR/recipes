import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AngularMaterialModule } from './angular-material.module';
import { RecipeCardFormComponent } from './components/recipe-card-form/recipe-card-form.component';
import { RecipeListComponent } from './components/recipe-list/recipe-list.component';
import { RecipeRibbonComponent } from './components/recipe-ribbon/recipe-ribbon.component';
import { RecipesMultipleSelectComponent } from './components/recipes-multiple-select/recipes-multiple-select.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    DragDropModule,

    // Own modules
    AngularMaterialModule,
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    DragDropModule,

    // Own modules
    AngularMaterialModule,

    // Shared Components
    RecipeCardFormComponent,
    RecipeListComponent,
    RecipeRibbonComponent,
    ToolbarComponent,
    RecipesMultipleSelectComponent
  ],
  declarations: [
    RecipeCardFormComponent,
    RecipeListComponent,
    RecipeRibbonComponent,
    ToolbarComponent,
    RecipesMultipleSelectComponent
  ],
})
export class SharedModule {}
