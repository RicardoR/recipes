import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AngularMaterialModule } from './angular-material.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FlexLayoutModule,

    // Own modules
    AngularMaterialModule,
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FlexLayoutModule,

    // Own modules
    AngularMaterialModule,
  ],
})
export class SharedModule {}
