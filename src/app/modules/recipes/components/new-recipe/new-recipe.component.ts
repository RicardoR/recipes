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
  hide = true;

  get steps(): FormArray {
    return this.form.get('steps') as FormArray;
  }

  constructor(
    private recipeService: RecipeService,
    private route: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private cdf: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  goToList(): void {
    this.route.navigate([AppRoutingNames.recipes]);
  }

  createReceip(): void {
    if (this.form.valid) {
      const steps = this.form.controls.steps.value.map((data: any) => data.stepData);

      const recipe: Recipe = {
        title: this.form.controls.title.value,
        description: this.form.controls.description.value,
        date: new Date(),
        ownerId: this.authService.currentUser?.uid,
        steps: steps,
      };

      this.recipeService
        .createRecipe(recipe)
        .pipe(take(1))
        .subscribe(() => this.goToList());
    }
  }

  stepItem(): FormGroup {
    return this.formBuilder.group({ stepData: undefined });
  }

  addStep(): void {
    this.steps.push(this.stepItem());
    this.cdf.detectChanges();
  }

  deleteStep(index: number): void {
    this.steps.removeAt(index);
    this.cdf.detectChanges();
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      title: this.formBuilder.control('', [Validators.required]),
      description: this.formBuilder.control('', [Validators.required]),
      steps: this.formBuilder.array([]),
    });
  }
}
