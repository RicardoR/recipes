import {CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray,} from '@angular/cdk/drag-drop';
import {
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatCardModule} from '@angular/material/card';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {AsyncPipe} from '@angular/common';
import {TextFieldModule} from '@angular/cdk/text-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

import {EMPTY, Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {AuthData} from 'src/app/core/auth/auth-data.model';
import {AuthService} from 'src/app/core/auth/services/auth.service';
import {Recipe} from 'src/app/features/recipes/models/recipes.model';
import {RecipeService} from 'src/app/features/recipes/services/recipe/recipe.service';
import {MessagesService} from '../../services/messages/messages.service';
import {UtilService} from '../../utils/utils.service';
import {NgLog} from '../../utils/decorators/log-decorator';
import {ElementModel} from 'src/app/features/recipes/models/element.model';
import {FileInputComponent} from '../file-input/file-input.component';
import {RecipesMultipleSelectComponent} from '../recipes-multiple-select/recipes-multiple-select.component';


export const MEDIA_STORAGE_PATH = `recipes/images`;

interface RecipeCardFormGroup {
  title: FormControl<string>;
  description: FormControl<string>;
  steps: FormArray<FormControl<string>>;
  ingredients: FormArray<FormControl<string>>;
  isPrivate: FormControl<boolean>;
  categorySelect: FormControl<ElementModel[] | null>;
}

@NgLog()
@Component({
  selector: 'app-recipe-card-form',
  templateUrl: './recipe-card-form.component.html',
  styleUrls: ['./recipe-card-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TextFieldModule,
    FileInputComponent,
    MatProgressBarModule,
    MatButtonModule,
    MatExpansionModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    RecipesMultipleSelectComponent,
    MatSlideToggleModule,
    AsyncPipe
  ]
})
export class RecipeCardFormComponent implements OnInit {
  readonly recipeChanged$ = output<Recipe>();
  readonly seeReceipt$ = output<void>();
  readonly recipeDetails = input<Recipe>();
  readonly isFormSending = input<boolean>();

  private fileToUpload!: File;
  private imageRoute = '';
  private destroyRef = inject(DestroyRef);
  private recipeService = inject(RecipeService);
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private cdf = inject(ChangeDetectorRef);
  private utilService = inject(UtilService);
  private messageService = inject(MessagesService);


  form!: FormGroup<RecipeCardFormGroup>;
  recipeImage: string | ArrayBuffer | undefined;
  pictureForm!: FormGroup<{photo: FormControl<File | null>}>;
  user?: AuthData;
  submitted = false;
  uploadProgress$!: Observable<number | undefined>;
  isOwnRecipe!: boolean;
  editingMode = false;
  isSending = signal(false);
  disabled = computed(() => {
    return this.isFormSending() || this.isSending();
  });
  categories?: ElementModel[] = undefined;

  get steps(): FormArray<FormControl<string>> {
    return this.form.controls.steps;
  }

  get ingredients(): FormArray<FormControl<string>> {
    return this.form.controls.ingredients;
  }

  constructor() {
    effect(() => {
      const recipeDetails = this.recipeDetails();
      if (recipeDetails) {
        this.fillEditingData();
        this.fillForm();
      }
    });
    this.initForm();
  }

  ngOnInit(): void {
    this.listenPicturesForm();
    this.getCategories();
  }

  sendRecipe(): void {
    if (this.form.valid) {
      this.isSending.set(true);

      const imageRoute = this.imageRoute
        ? this.imageRoute
        : this.recipeDetails()?.imgSrc;

      const recipe: Recipe = {
        title: this.form.controls.title.getRawValue(),
        description: this.form.controls.description.getRawValue(),
        date: this.recipeDetails()?.date ?? new Date(),
        ownerId: this.authService.currentUser?.uid,
        steps: this.steps.getRawValue(),
        ingredients: this.ingredients.getRawValue(),
        id: this.recipeDetails()?.id ?? '',
        imgSrc: imageRoute ? imageRoute : '',
        private: this.form.controls.isPrivate.getRawValue(),
        categories: this.form.controls.categorySelect.getRawValue() ?? [],
      };

      this.recipeChanged$.emit(recipe);
      this.isSending.set(false);
    }
  }

  createFormItem(data = ''): FormControl<string> {
    return this.formBuilder.nonNullable.control(data);
  }

  deleteControl(control: FormArray<FormControl<string>>, index: number): void {
    control.removeAt(index);
    this.cdf.detectChanges();
  }

  addControl(control: FormArray<FormControl<string>>, $event: Event): void {
    control.push(this.createFormItem());
    this.cdf.detectChanges();

    $event.preventDefault();
  }

  postImage(): void {
    this.submitted = true;

    const {downloadUrl$, uploadProgress$} =
      this.recipeService.uploadFileAndGetMetadata(
        MEDIA_STORAGE_PATH,
        this.fileToUpload
      );
    this.uploadProgress$ = uploadProgress$;

    downloadUrl$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
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

  dropElement(
    event: CdkDragDrop<string[]>,
    list: FormControl<string>[]
  ): void {
    moveItemInArray(list, event.previousIndex, event.currentIndex);
  }

  seeReceipt(): void {
    this.seeReceipt$.emit();
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      title: this.formBuilder.nonNullable.control('', [Validators.required]),
      description: this.formBuilder.nonNullable.control('', [
        Validators.required,
      ]),
      steps: this.formBuilder.array<FormControl<string>>([]),
      ingredients: this.formBuilder.array<FormControl<string>>([]),
      isPrivate: this.formBuilder.nonNullable.control(false),
      categorySelect: this.formBuilder.control<ElementModel[] | null>(null),
    });

    this.pictureForm = this.formBuilder.group({
      photo: this.formBuilder.control<File | null>(null, [
        Validators.required,
        this.imageValidator.bind(this),
      ]),
    });

    this.user = this.authService.currentUser;
  }

  private imageValidator(
    photoControl: AbstractControl
  ): ValidationErrors | null {
    if (photoControl.value) {
      const recipeImage = photoControl.value;
      return this.utilService.validateFile(recipeImage)
        ? null
        : {image: true};
    }
    return null;
  }

  private listenPicturesForm(): void {
    this.pictureForm.controls.photo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((file) => this.handleFileChange(file));
  }

  private handleFileChange(recipeImage: File | null): void {
    if (!recipeImage) {
      return;
    }
    this.fileToUpload = recipeImage;
    const reader = new FileReader();
    reader.onload = (loadEvent) =>
      (this.recipeImage = loadEvent.target?.result || undefined);
    reader.readAsDataURL(recipeImage);
  }

  private fillEditingData(): void {
    this.editingMode = true;
    this.isOwnRecipe = this.recipeDetails()?.ownerId === this.user?.uid;
    this.recipeImage = this.recipeDetails()?.imgSrc;
  }

  private fillForm(): void {
    this.form.controls.title.patchValue(this.recipeDetails()?.title ?? '');
    this.form.controls.description.patchValue(
      this.recipeDetails()?.description ?? ''
    );
    this.form.controls.isPrivate.patchValue(this.recipeDetails()?.private ?? false);
    this.recipeDetails()?.steps.forEach((step) => {
      this.form.controls.steps.push(this.createFormItem(step));
    });

    this.recipeDetails()?.ingredients.forEach((ingredient) => {
      this.form.controls.ingredients.push(this.createFormItem(ingredient));
    });

    this.form.controls.categorySelect.patchValue(
      this.recipeDetails()?.categories ?? null
    );
  }

  private getCategories(): void {
    this.recipeService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categories) => (this.categories = categories));
  }
}
