import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { DocumentChangeAction } from '@angular/fire/firestore/interfaces';
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/storage';
import { BehaviorSubject, from, Observable, Subject } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { Recipe } from './../../models/recipes.model';
import { AuthService } from '../../../auth/services/auth.service';

const enum DatabaseCollectionsNames {
  recipes = 'recipes',
  own = 'own',
}

export interface FilesUploadMetadata {
  uploadProgress$: Observable<number | undefined>;
  downloadUrl$: Observable<string>;
}

const DEFAULT_IMAGE = 'assets/images/verduras.jpeg';

@Injectable()
export class RecipeService {
  private userId?: string;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private storage: AngularFireStorage
  ) {}

  getOwnRecipes(): Observable<any> {
    const result = new Subject<Recipe[]>();
    const privateRecipeNameCollection = this.getPrivateRecipeNameCollection();

    // todo: refactor!
    this.firestore
      .collection(privateRecipeNameCollection, (ref) =>
        ref.orderBy('date', 'desc')
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

  getPublicRecipes(): Observable<any> {
    const result = new Subject<Recipe[]>();
    const publicRecipeNameCollection = `${DatabaseCollectionsNames.recipes}`;

    // todo: refactor!
    this.firestore
      .collection(publicRecipeNameCollection, (ref) =>
        ref.orderBy('date', 'desc')
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

  createRecipe(recipe: Recipe): Observable<void> {
    const result = new Subject<void>();
    const privateRecipeNameCollection = this.getPrivateRecipeNameCollection();

    this.firestore
      .collection(privateRecipeNameCollection)
      .add(recipe)
      .then(() => result.next());

    return result;
  }

  editRecipe(recipe: Recipe): Observable<void> {
    const result = new Subject<void>();
    const privateRecipeNameCollection = this.getPrivateRecipeNameCollection();

    this.firestore
      .collection(privateRecipeNameCollection)
      .doc(recipe.id)
      .update(recipe)
      .then(() => result.next());

    return result;
  }

  getPrivateRecipeDetail(id: string): Observable<Recipe> {
    const result = new Subject<Recipe>();
    const privateRecipeNameCollection = this.getPrivateRecipeNameCollection();
    this.firestore
      .collection(privateRecipeNameCollection)
      .doc(id)
      .get()
      .pipe(
        take(1),
        map((doc) => this.recipesConverter(doc.data(), doc.id))
      )
      .subscribe((data) => {
        result.next(data);
        result.complete();
      });

    return result;
  }

  deleteRecipe(id: string): Observable<boolean> {
    const result = new Subject<boolean>();
    const privateRecipeNameCollection = this.getPrivateRecipeNameCollection();
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
    if (ref === DEFAULT_IMAGE) {
      return new BehaviorSubject<any>(true);
    }
    return this.storage.refFromURL(ref).delete();
  }

  private getPrivateRecipeNameCollection(): string {
    if (this.userId === undefined) {
      this.userId = this.authService.currentUser?.uid;
    }
    return `${DatabaseCollectionsNames.recipes}/${this.userId}/${DatabaseCollectionsNames.own}`;
  }

  private recipesConverter(docData: any, id: string): Recipe {
    if (docData === undefined) {
      throw new Error('Recipe does not exists');
    }

    return {
      date: docData.date.toDate(),
      title: docData.title,
      description: docData.description,
      id: id,
      ownerId: docData.ownerId,
      steps: docData.steps,
      ingredients: docData.ingredients,
      imgSrc: docData.imgSrc ? docData.imgSrc : DEFAULT_IMAGE,
    } as Recipe;
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
