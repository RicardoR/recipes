import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DocumentChangeAction } from '@angular/fire/compat/firestore/interfaces';
import { Router } from '@angular/router';
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/compat/storage';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  Subject,
  ReplaySubject,
  from,
} from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';

import { Recipe } from '../../models/recipes.model';
import { AuthService } from '../../../auth/services/auth.service';
import { ElementModel } from '../../models/element.model';
import { AppRoutingNames } from 'src/app/app.routes';

const enum DatabaseCollectionsNames {
  recipes = 'recipes',
  categories = 'categories',
}

export interface FilesUploadMetadata {
  uploadProgress$: Observable<number | undefined>;
  downloadUrl$: Observable<string>;
}

const DEFAULT_IMAGE = 'assets/images/verduras.jpeg';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private categoryList?: ElementModel[] = undefined;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private storage: AngularFireStorage,
    private router: Router
  ) {}

  getOwnRecipes(): Observable<Recipe[]> {
    const result = new ReplaySubject<Recipe[]>();
    const privateRecipeNameCollection = DatabaseCollectionsNames.recipes;
    const userId = this.authService.currentUser?.uid;

    this.firestore
      .collection(privateRecipeNameCollection, (ref) =>
        ref.where('ownerId', '==', userId).orderBy('date', 'desc')
      )
      .stateChanges()
      .pipe(
        take(1),
        map((docArray: DocumentChangeAction<any>[]) => {
          return docArray.map((document: DocumentChangeAction<any>) => {
            const docData = document.payload.doc.data();
            return this.recipesConverter(docData, document.payload.doc.id);
          });
        })
      )
      .subscribe((recipes: Recipe[]) => result.next(recipes));

    return result;
  }

  getCategories(): Observable<ElementModel[]> {
    const result = new ReplaySubject<ElementModel[]>();
    if (this.categoryList) {
      result.next(this.categoryList);
      return result;
    }

    this.firestore
      .collection(DatabaseCollectionsNames.categories)
      .stateChanges()
      .pipe(
        take(1),
        map((docArray: DocumentChangeAction<any>[]) => {
          return docArray.map((document: DocumentChangeAction<any>) => {
            const docData = document.payload.doc.data();
            return this.elementModelConverter(docData);
          });
        }),
        tap((categories: ElementModel[]) => (this.categoryList = categories))
      )
      .subscribe((categoriesList: ElementModel[]) => {
        result.next(categoriesList);
      });

    return result;
  }

  getPublicRecipes(): Observable<any> {
    const userId = this.authService.currentUser?.uid
      ? this.authService.currentUser?.uid
      : '-1';

    const result = new ReplaySubject<Recipe[]>();
    const publicRecipeNameCollection = DatabaseCollectionsNames.recipes;

    const queryOne = this.firestore
      .collection(publicRecipeNameCollection, (ref) =>
        ref.where('private', '==', false).orderBy('date', 'desc')
      )
      .stateChanges();

    const queryTwo = this.firestore
      .collection(publicRecipeNameCollection, (ref) =>
        ref
          .where('private', '==', true)
          .where('ownerId', '==', userId)
          .orderBy('date', 'desc')
      )
      .stateChanges();

    combineLatest([queryOne, queryTwo])
      .pipe(
        take(1),
        map(([docOne, docTwo]) => {
          const allRecipes = [...docOne, ...docTwo];

          return allRecipes.map((document: DocumentChangeAction<any>) => {
            const docData = document.payload.doc.data();
            return this.recipesConverter(docData, document.payload.doc.id);
          });
        })
      )
      .subscribe((recipes: Recipe[]) => {
        recipes.sort(
          (recipeOne, recipeTwo) =>
            recipeTwo.date?.getTime() - recipeOne.date?.getTime()
        );
        result.next(recipes);
      });

    return result;
  }

  createRecipe(recipe: Recipe): Observable<string> {
    if (this.authService.isDemoUser) {
      throw new Error('You can not create a recipe with demo user');
    }
    const result = new Subject<string>();
    const recipeNameCollection = DatabaseCollectionsNames.recipes;

    this.firestore
      .collection(recipeNameCollection)
      .add(recipe)
      .then((data) => result.next(data.id));

    return result;
  }

  cloneRecipe(recipe: Recipe): Observable<string> {
    const userId = this.authService.currentUser?.uid;

    const recipeCloned = { ...recipe };
    recipeCloned.id = '';
    recipeCloned.imgSrc = '';
    recipeCloned.ownerId = userId;
    recipeCloned.date = new Date();
    recipeCloned.categories = recipe.categories ?? [];

    return this.createRecipe(recipeCloned);
  }

  updateRecipe(recipe: Recipe): Observable<void> {
    if (this.authService.isDemoUser) {
      throw new Error('You can not update a recipe with demo user');
    }

    const result = new Subject<void>();
    const privateRecipeNameCollection = DatabaseCollectionsNames.recipes;

    this.firestore
      .collection(privateRecipeNameCollection)
      .doc(recipe.id)
      .update(recipe)
      .then(() => result.next());

    return result;
  }

  getRecipeDetail(id: string | null): Observable<Recipe> {
    if (id === null) {
      throw new Error('RecipeId is mandatory');
    }

    const result = new Subject<Recipe>();
    const privateRecipeNameCollection = DatabaseCollectionsNames.recipes;

    this.firestore
      .collection(privateRecipeNameCollection)
      .doc(id)
      .get()
      .pipe(
        take(1),
        map((doc) => this.recipesConverter(doc.data(), doc.id))
      )
      .subscribe((data: Recipe) => {
        result.next(data);
        result.complete();
      });

    return result;
  }

  deleteRecipe(id: string): Observable<boolean> {
    if (this.authService.isDemoUser) {
      throw new Error('You can not delete a recipe with demo user');
    }

    const result = new Subject<boolean>();
    const privateRecipeNameCollection = DatabaseCollectionsNames.recipes;
    this.firestore
      .collection(privateRecipeNameCollection)
      .doc(id)
      .delete()
      .then(() => {
        result.next(true);
        result.complete();
      });
    return result;
  }

  uploadFileAndGetMetadata(
    mediaFolderPath: string,
    fileToUpload: File
  ): FilesUploadMetadata {
    if (this.authService.isDemoUser) {
      throw new Error('You can not upload a picture with demo user');
    }
    const { name } = fileToUpload;
    const filePath = `${mediaFolderPath}/${new Date().getTime()}_${name}`;
    const uploadTask: AngularFireUploadTask = this.storage.upload(
      filePath,
      fileToUpload
    );

    return {
      uploadProgress$: uploadTask.percentageChanges(),
      downloadUrl$: this.getDownloadUrl$(uploadTask, filePath),
    };
  }

  deleteImage(ref: string): Observable<any> {
    if (this.authService.isDemoUser) {
      throw new Error('You can not do this with demo user');
    }

    if (ref === DEFAULT_IMAGE) {
      return new BehaviorSubject<any>(true);
    }
    return this.storage.refFromURL(ref).delete();
  }

  filterRecipes(recipesList: Recipe[], filter: string): Recipe[] {
    filter = filter?.trim().toLowerCase();
    return recipesList.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(filter.toLowerCase()) ||
        recipe.description.toLowerCase().includes(filter.toLowerCase())
    );
  }

  private recipesConverter(docData: any, id: string): Recipe {
    if (docData === undefined) {
      this.router.navigate([AppRoutingNames.recipes]);
      throw new Error('Recipe does not exists');
    }

    return {
      date: docData.date?.toDate(),
      title: docData.title,
      description: docData.description,
      id: id,
      ownerId: docData.ownerId,
      steps: docData.steps,
      ingredients: docData.ingredients,
      imgSrc: docData.imgSrc ? docData.imgSrc : DEFAULT_IMAGE,
      private: docData.private,
      categories: docData.categories,
    };
  }

  private elementModelConverter(docData: any): ElementModel {
    if (docData === undefined) {
      throw new Error('Element does not exists');
    }

    return {
      id: docData.id,
      detail: docData.detail,
    };
  }

  private getDownloadUrl$(
    uploadTask: AngularFireUploadTask,
    path: string
  ): Observable<string> {
    return from(uploadTask).pipe(
      switchMap((_) => this.storage.ref(path).getDownloadURL())
    );
  }
}
