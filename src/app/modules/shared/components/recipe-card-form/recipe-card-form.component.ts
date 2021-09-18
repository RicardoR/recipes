import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { EMPTY, Observable, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { AuthData } from 'src/app/modules/auth/auth-data.model';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { Recipe } from 'src/app/modules/recipes/models/recipes.model';
import { RecipeService } from 'src/app/modules/recipes/services/recipe/recipe.service';
import { MessagesService } from '../../services/messages/messages.service';
import { UtilService } from '../../services/utils/utils.service';

export const MEDIA_STORAGE_PATH = `recipes/images`;

@Component({
  selector: 'app-recipe-card-form',
  templateUrl: './recipe-card-form.component.html',
  styleUrls: ['./recipe-card-form.component.scss'],
})
export class RecipeCardFormComponent implements OnInit {
  @Output() recipeChanged$: EventEmitter<Recipe> = new EventEmitter();

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
    private recipeService: RecipeService,
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

  sendReceip(): void {
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

      this.recipeChanged$.emit(recipe);
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

  postImage(): void {
    this.submitted = true;

    const { downloadUrl$, uploadProgress$ } =
      this.recipeService.uploadFileAndGetMetadata(
        MEDIA_STORAGE_PATH,
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

  dropElement(event: CdkDragDrop<string[]>, list: AbstractControl[]): void {
    moveItemInArray(list, event.previousIndex, event.currentIndex);
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      title: this.formBuilder.control('', [Validators.required]),
      description: this.formBuilder.control('', [Validators.required]),
      steps: this.formBuilder.array([]),
      ingredients: this.formBuilder.array([]),
    });

    this.pictureForm = this.formBuilder.group({
      photo: [null, [Validators.required, this.imageValidator.bind(this)]],
    });

    this.user = this.authService.currentUser;
  }

  private imageValidator(
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

  private listenPicturesForm(): void {
    this.pictureForm
      ?.get('photo')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((newValue) => this.handleFileChange(newValue.files));
  }

  private handleFileChange([recipeImage]: any): void {
    this.fileToUpload = recipeImage;
    const reader = new FileReader();
    reader.onload = (loadEvent) =>
      (this.recipeImage = loadEvent.target?.result || undefined);
    reader.readAsDataURL(recipeImage);
  }
}
