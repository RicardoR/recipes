import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, of, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';

import { AppRoutingNames } from 'src/app/app-routing.module';
import { AuthData } from 'src/app/modules/auth/auth-data.model';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { MessagesService } from 'src/app/modules/shared/services/messages/messages.service';
import { UtilService } from 'src/app/modules/shared/services/utils/utils.service';
import { Recipe } from '../../models/recipes.model';
import { RecipesRoutingNames } from '../../recipes-routing.module';
import { RecipeService } from '../../services/recipe/recipe.service';
import { MEDIA_STORAGE_PATH } from '../new-recipe/new-recipe.component';

@Component({
  selector: 'app-edit-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.scss'],
})
export class EditRecipeComponent implements OnInit, OnDestroy {
  recipeDetails!: Recipe;
  isOwnReceip = false;
  form!: FormGroup;
  recipeImage: string | ArrayBuffer | undefined;
  pictureForm!: FormGroup;
  user!: AuthData;
  submitted = false;
  uploadProgress$!: Observable<number | undefined>;
  private fileToUpload!: File;
  private imageRoute: string = '';
  private destroy$: Subject<null> = new Subject();

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
    private cdf: ChangeDetectorRef,
    private utilService: UtilService
  ) {}

  ngOnInit(): void {
    this.getRecipeDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
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

      const image = this.imageRoute
        ? this.imageRoute
        : this.recipeDetails.imgSrc;

      const recipe: Recipe = {
        title: this.form.controls.title.value,
        description: this.form.controls.description.value,
        date: this.recipeDetails.date,
        ownerId: this.authService.currentUser?.uid,
        steps: steps,
        ingredients: ingredients,
        id: this.recipeDetails.id,
        imgSrc: image,
      };

      this.recipesService
        .editRecipe(recipe)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => {
            if (this.imageRoute) {
              return this.recipesService.deleteImage(this.recipeDetails.imgSrc);
            }
            return of({});
          })
        )
        .subscribe(() => {
          this.messagesService.showSnackBar('Receta actualizada');
          setTimeout(() => {
              // todo: try to avoid this!!
              window.location.reload();
          }, 700)
        }
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

  seeReceip(): void {
    this.router.navigate([
      `${AppRoutingNames.recipes}/${RecipesRoutingNames.details}`,
      this.recipeDetails.id,
    ]);
  }

  postImage(): void {
    this.submitted = true;

    const { downloadUrl$, uploadProgress$ } =
      this.recipesService.uploadFileAndGetMetadata(
        MEDIA_STORAGE_PATH,
        this.fileToUpload
      );

    this.uploadProgress$ = uploadProgress$;

    downloadUrl$
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.messagesService.showSnackBar(`${error.message}`);
          return EMPTY;
        })
      )
      .subscribe((downloadUrl) => {
        this.submitted = false;
        this.imageRoute = downloadUrl;
      });
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

    this.pictureForm = this.formBuilder.group({
      photo: ['', [Validators.required, this.image.bind(this)]],
    });

    this.recipeImage = this.recipeDetails.imgSrc;
    this.user = this.authService.currentUser;
    this.listenPicturesForm();
  }

  private image(
    photoControl: AbstractControl
  ): { [key: string]: boolean } | null | void {
    if (photoControl.value) {
      const [recipeImage] = photoControl.value.files;
      return this.utilService.validateFile(recipeImage)
        ? null
        : { image: true };
    }
    return;
  }

  private getRecipeDetails(): void {
    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroy$),
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

  private listenPicturesForm(): void {
    this.pictureForm
      ?.get('photo')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((newValue) => this.handleFileChange(newValue.files));
  }

  private handleFileChange([recipeImage]: any) {
    this.fileToUpload = recipeImage;
    const reader = new FileReader();
    reader.onload = (loadEvent) =>
      (this.recipeImage = loadEvent.target?.result || undefined);
    reader.readAsDataURL(recipeImage);
  }
}
