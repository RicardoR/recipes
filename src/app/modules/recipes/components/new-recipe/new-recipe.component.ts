import { MessagesService } from './../../../shared/services/messages/messages.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { catchError, takeUntil } from 'rxjs/operators';
import { EMPTY, Subject } from 'rxjs';

import { Recipe } from './../../models/recipes.model';
import { AuthService } from './../../../auth/services/auth.service';
import { RecipeService } from '../../services/recipe/recipe.service';
import { AppRoutingNames } from 'src/app/app-routing.module';
import { AuthData } from 'src/app/modules/auth/auth-data.model';
import { UtilService } from 'src/app/modules/shared/services/utils/utils.service';

export const MEDIA_STORAGE_PATH = `recipes`;
export const imageByDefault = `https://firebasestorage.googleapis.com/v0/b/recipes-4b9e9.appspot.com/o/recipes%2Frirova81%40gmail.com%2Fmedia%2F1629993697082_verduras.jpeg?alt=media&token=d0825fe1-4941-4ad1-bfd4-df4f3e82ff6e`;

@Component({
  selector: 'app-new-recipe',
  templateUrl: './new-recipe.component.html',
  styleUrls: ['./new-recipe.component.scss'],
})
export class NewRecipeComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  destroy$: Subject<null> = new Subject();
  fileToUpload!: File;
  recipeImage: string | ArrayBuffer | undefined;
  pictureForm!: FormGroup;
  user!: AuthData;
  submitted = false;
  uploadProgress$: any; // todo: any?

  private imageRoute: string = imageByDefault;

  get steps(): FormArray {
    return this.form.get('steps') as FormArray;
  }

  get ingredients(): FormArray {
    return this.form.get('ingredients') as FormArray;
  }

  constructor(
    private recipeService: RecipeService,
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private cdf: ChangeDetectorRef,
    private utilService: UtilService,
    private messageService: MessagesService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.listenPicturesForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
  }

  goToList(): void {
    this.router.navigate([AppRoutingNames.recipes]);
  }

  createReceip(): void {
    if (this.form.valid) {
      const steps = this.steps.value.map((step: any) => step.data);
      const ingredients = this.ingredients.value.map(
        (ingredient: any) => ingredient.data
      );

      const recipe: Recipe = {
        title: this.form.controls.title.value,
        description: this.form.controls.description.value,
        date: new Date(),
        ownerId: this.authService.currentUser?.uid,
        steps: steps,
        ingredients: ingredients,
        id: '',
        imgSrc: this.imageRoute,
      };

      this.recipeService
        .createRecipe(recipe)
        .pipe(takeUntil(this.destroy$))
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

  postImage() {
    this.submitted = true;
    const mediaFolderPath = `${MEDIA_STORAGE_PATH}/${this.user.email}/media/`;

    const { downloadUrl$, uploadProgress$ } =
      this.recipeService.uploadFileAndGetMetadata(
        mediaFolderPath,
        this.fileToUpload
      );
    this.uploadProgress$ = uploadProgress$;

    downloadUrl$
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.messageService.showSnackBar(`${error.message}`);
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
      title: this.formBuilder.control('', [Validators.required]),
      description: this.formBuilder.control('', [Validators.required]),
      steps: this.formBuilder.array([]),
      ingredients: this.formBuilder.array([]),
    });

    this.pictureForm = this.formBuilder.group({
      photo: [null, [Validators.required, this.image.bind(this)]],
    });

    this.user = this.authService.currentUser;
  }

  private image(
    photoControl: AbstractControl
  ): { [key: string]: boolean } | null | void {
    if (photoControl.value) {
      const [kittyImage] = photoControl.value.files;
      return this.utilService.validateFile(kittyImage) ? null : { image: true };
    }
    return;
  }

  private listenPicturesForm() {
    this.pictureForm
      ?.get('photo')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((newValue) => this.handleFileChange(newValue.files));
  }

  private handleFileChange([kittyImage]: any) {
    this.fileToUpload = kittyImage;
    const reader = new FileReader();
    reader.onload = (loadEvent) =>
      (this.recipeImage = loadEvent.target?.result || undefined);
    reader.readAsDataURL(kittyImage);
  }
}
