import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
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
import { UtilService } from '../../utils/utils.service';
import { NgLog } from '../../utils/decorators/log-decorator';

export const MEDIA_STORAGE_PATH = `recipes/images`;

@NgLog()
@Component({
  selector: 'app-recipe-card-form',
  templateUrl: './recipe-card-form.component.html',
  styleUrls: ['./recipe-card-form.component.scss'],
})
export class RecipeCardFormComponent implements OnInit {
  @Output() recipeChanged$: EventEmitter<Recipe> = new EventEmitter();
  @Output() seeReceipt$: EventEmitter<void> = new EventEmitter();

  @Input() set recipeDetails(value: Recipe) {
    if (value) {
      this._recipeDetails = value;
      this.fillEditingData();
      this.fillForm();
    }
  }

  @Input() set isFormSending(value: boolean) {
    this.isSending = value;
  }

  form!: FormGroup;

  recipeImage: string | ArrayBuffer | undefined;
  pictureForm!: FormGroup;
  user?: AuthData;
  submitted = false;
  uploadProgress$!: Observable<number | undefined>;
  isOwnRecipe!: boolean;
  edittingMode: boolean = false;
  isSending = false;

  private fileToUpload!: File;
  private imageRoute: string = '';
  private destroy$: Subject<null> = new Subject();
  private _recipeDetails!: Recipe;

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
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.listenPicturesForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
  }

  sendRecipe(): void {
    if (this.form.valid) {
      this.isSending = true;
      const steps = this.steps.value.map(
        (value: any) => value.data
      );
      const ingredients = this.ingredients.value.map(
        (value: any) => value.data
      );

      const imageRoute = this.imageRoute
        ? this.imageRoute
        : this._recipeDetails?.imgSrc;

      const recipe: Recipe = {
        title: this.form.controls.title.value,
        description: this.form.controls.description.value,
        date: this._recipeDetails ? this._recipeDetails.date : new Date(),
        ownerId: this.authService.currentUser?.uid,
        steps: steps,
        ingredients: ingredients,
        id: this._recipeDetails ? this._recipeDetails.id : '',
        imgSrc: imageRoute ? imageRoute : '',
        private: this.form.controls.isPrivate.value,
      };

      this.recipeChanged$.emit(recipe);
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

  seeReceipt(): void {
    this.seeReceipt$.next();
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      title: this.formBuilder.control('', [Validators.required]),
      description: this.formBuilder.control('', [Validators.required]),
      steps: this.formBuilder.array([]),
      ingredients: this.formBuilder.array([]),
      isPrivate: this.formBuilder.control(false),
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

  private fillEditingData(): void {
    this.edittingMode = true;
    this.isOwnRecipe = this._recipeDetails.ownerId === this.user?.uid;
    this.recipeImage = this._recipeDetails.imgSrc;
  }

  private fillForm(): void {
    this.form.controls.title.patchValue(this._recipeDetails.title);
    this.form.controls.description.patchValue(this._recipeDetails.description);
    this.form.controls.isPrivate.patchValue(this._recipeDetails.private);
    this._recipeDetails.steps.forEach((step) => {
      (<FormArray>this.form.controls.steps).push(this.createFormItem(step));
    });

    this._recipeDetails.ingredients.forEach((ingredient) => {
      (<FormArray>this.form.controls.ingredients).push(
        this.createFormItem(ingredient)
      );
    });
  }
}
