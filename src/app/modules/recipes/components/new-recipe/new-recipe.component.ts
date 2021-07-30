import { AuthService } from './../../../auth/services/auth.service';
import { take } from 'rxjs/operators';
import { Recipe } from './../../models/recipes.model';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { RecipeService } from '../../services/recipe/recipe.service';
import { AppRoutingNames } from 'src/app/app-routing.module';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-new-recipe',
  templateUrl: './new-recipe.component.html',
  styleUrls: ['./new-recipe.component.scss'],
})
export class NewRecipeComponent implements OnInit {
  form!: FormGroup;
  hide = true;

  constructor(
    private recipeService: RecipeService,
    private route: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  goToList(): void {
    this.route.navigate([AppRoutingNames.recipes]);
  }

  createReceip(): void {
    if (this.form.valid) {

      const recipe: Recipe = {
        title: this.form.controls.title.value,
        description: this.form.controls.description.value,
        date: new Date(),
        ownerId: this.authService.currentUser?.uid,
      };

      this.recipeService.createRecipe(recipe)
        .pipe(take(1))
        .subscribe(() => this.goToList());
    }
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      title: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
    });
  }
}
