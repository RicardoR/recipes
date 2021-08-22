import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, take } from 'rxjs/operators';

import { AppRoutingNames } from 'src/app/app-routing.module';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { MessagesService } from 'src/app/modules/shared/services/messages/messages.service';
import { Recipe } from '../../models/recipes.model';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { RecipeService } from '../../services/recipe/recipe.service';

@Component({
  selector: 'app-edit-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.scss'],
})
export class EditRecipeComponent implements OnInit {
  recipeDetails!: Recipe;
  isOwnReceip = false;
  form!: FormGroup;

  get steps(): FormArray {
    return this.form.get('steps') as FormArray;
  }

  get ingredients(): FormArray {
    return this.form.get('ingredients') as FormArray;
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private recipesService: RecipeService,
    private messagesService: MessagesService,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private cdf: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getRecipeDetails();
  }

  goToList(): void {
    this.router.navigate([AppRoutingNames.recipes]);
  }

  editReceip(): void {
    if (this.form.valid) {
      const steps = this.steps.value.map((step: any) => step.data);
      const ingredients = this.ingredients.value.map(
        (ingredient: any) => ingredient.data
      );

      const recipe: Recipe = {
        title: this.form.controls.title.value,
        description: this.form.controls.description.value,
        date: this.recipeDetails.date,
        ownerId: this.authService.currentUser?.uid,
        steps: steps,
        ingredients: ingredients,
        id: this.recipeDetails.id,
      };

      this.recipesService
        .editRecipe(recipe)
        .pipe(take(1))
        .subscribe(() =>
          this.messagesService.showSnackBar('Receta actualizada');
        );
    }
  }

  createFormItem(data?: string): FormGroup {
    return this.formBuilder.group({ data: data });
  }

  deleteControl(control: FormArray, index: number): void {
    control.removeAt(index);
    this.cdf.detectChanges();
  }

  addControl(control: FormArray, $event: any): void {
    control.push(this.createFormItem());
    this.cdf.detectChanges();

    $event.preventDefault();
  }

  seeReceip() {
        this.router.navigate([`${AppRoutingNames.recipes}/${RecipesRoutingNames.details}`, this.recipeDetails.id]);
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      title: this.formBuilder.control(this.recipeDetails.title, [
        Validators.required,
      ]),
      description: this.formBuilder.control(this.recipeDetails.description, [
        Validators.required,
      ]),
      steps: this.formBuilder.array([]),
      ingredients: this.formBuilder.array([]),
    });

    this.recipeDetails.steps.forEach((step) => {
      (<FormArray>this.form.controls['steps']).push(this.createFormItem(step));
    });

    this.recipeDetails.ingredients.forEach((ingredient) => {
      (<FormArray>this.form.controls['ingredients']).push(
        this.createFormItem(ingredient)
      );
    });
  }

  private getRecipeDetails(): void {
    this.activatedRoute.params
      .pipe(
        take(1),
        switchMap((param) =>
          this.recipesService.getPrivateRecipeDetail(param.id)
        )
      )
      .subscribe((data: Recipe) => {
        this.recipeDetails = data;
        this.isOwnReceip = data.ownerId === this.authService.currentUser?.uid;
        this.initForm();
      });
  }
}
