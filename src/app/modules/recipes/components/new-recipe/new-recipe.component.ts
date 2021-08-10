import { AuthService } from './../../../auth/services/auth.service';
import { take } from 'rxjs/operators';
import { Recipe } from './../../models/recipes.model';
import { Router } from '@angular/router';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { RecipeService } from '../../services/recipe/recipe.service';
import { AppRoutingNames } from 'src/app/app-routing.module';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-new-recipe',
  templateUrl: './new-recipe.component.html',
  styleUrls: ['./new-recipe.component.scss'],
})
export class NewRecipeComponent implements OnInit {
  form!: FormGroup;

  get steps(): FormArray {
    return this.form.get('steps') as FormArray;
  }

  get ingredients(): FormArray {
    return this.form.get('ingredients') as FormArray;
  }

  constructor(
    private recipeService: RecipeService,
    private route: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private cdf: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  goToList(): void {
    this.route.navigate([AppRoutingNames.recipes]);
  }

  createReceip(): void {
    if (this.form.valid) {
      const steps = this.steps.value.map((step: any) => step.data);
      const ingredients = this.ingredients.value.map((ingredient: any) => ingredient.data);

      const recipe: Recipe = {
        title: this.form.controls.title.value,
        description: this.form.controls.description.value,
        date: new Date(),
        ownerId: this.authService.currentUser?.uid,
        steps: steps,
        ingredients: ingredients,
      };

      this.recipeService
        .createRecipe(recipe)
        .pipe(take(1))
        .subscribe(() => this.goToList());
    }
  }

  formItem(): FormGroup {
    return this.formBuilder.group({ data: undefined });
  }

  deleteControl(control: FormArray, index: number): void {
    control.removeAt(index);
    this.cdf.detectChanges();
  }

  addControl(control: FormArray, $event: any): void {
    control.push(this.formItem());
    this.cdf.detectChanges();

    $event.preventDefault();
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      title: this.formBuilder.control('', [Validators.required]),
      description: this.formBuilder.control('', [Validators.required]),
      steps: this.formBuilder.array([]),
      ingredients: this.formBuilder.array([]),
    });
  }
}
