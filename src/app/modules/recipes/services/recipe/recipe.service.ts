import { Injectable, inject } from '@angular/core';
import {Router} from '@angular/router';
import {deleteObject, FirebaseStorage, getDownloadURL, ref, Storage, uploadBytesResumable} from '@angular/fire/storage';
import {from, Observable, of, ReplaySubject, Subject,} from 'rxjs';

import {Recipe} from '../../models/recipes.model';
import {AuthService} from '../../../auth/services/auth.service';
import {ElementModel} from '../../models/element.model';
import {AppRoutingNames} from 'src/app/app.routes';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where
} from '@angular/fire/firestore';

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
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private router = inject(Router);
  private storage = inject(Storage);

  private categoryList?: ElementModel[] = undefined;

  getOwnRecipes(): Observable<Recipe[]> {
    const result = new ReplaySubject<Recipe[]>();
    const privateRecipeNameCollection = DatabaseCollectionsNames.recipes;
    const userId = this.authService.currentUser?.uid;

    const collectionRef = collection(this.firestore, privateRecipeNameCollection);
    const queryData = query(collectionRef, where('ownerId', '==', userId), orderBy('date', 'desc'));

    getDocs(queryData).then((querySnapshot) => {
      const recipes: Recipe[] = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        recipes.push(this.recipesConverter(docData, doc.id));
      });
      result.next(recipes);
      return recipes;
    })

    return result;
  }

  getCategories(): Observable<ElementModel[]> {
    const result = new ReplaySubject<ElementModel[]>();
    if (this.categoryList) {
      result.next(this.categoryList);
      return result;
    }

    const collectionRef = collection(this.firestore, DatabaseCollectionsNames.categories);

    getDocs(collectionRef).then((querySnapshot) => {
      const categories: ElementModel[] = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        categories.push(this.elementModelConverter(docData));
      });
      this.categoryList = categories;
      result.next(categories);
    })

    return result;
  }

  getPublicRecipes(): Observable<Recipe[]> {
    const userId = this.authService.currentUser?.uid ?? '-1';
    const result = new ReplaySubject<Recipe[]>();
    const recipesCollection = DatabaseCollectionsNames.recipes;

    const publicQuery = query(
      collection(this.firestore, recipesCollection),
      where('private', '==', false),
      orderBy('date', 'desc')
    );

    const privateQuery = query(
      collection(this.firestore, recipesCollection),
      where('private', '==', true),
      where('ownerId', '==', userId),
      orderBy('date', 'desc')
    );

    Promise.all([getDocs(publicQuery), getDocs(privateQuery)]).then(([publicSnap, privateSnap]) => {
      const allDocs = [...publicSnap.docs, ...privateSnap.docs];
      const recipes = allDocs.map(doc => this.recipesConverter(doc.data(), doc.id));
      recipes.sort((a, b) => b.date?.getTime() - a.date?.getTime());
      result.next(recipes);
    });

    return result;
  }

  createRecipe(recipe: Recipe): Observable<string> {
    if (this.authService.isDemoUser) {
      throw new Error('You can not create a recipe with demo user');
    }
    const recipeNameCollection = DatabaseCollectionsNames.recipes;

    const collectionRef = collection(this.firestore, recipeNameCollection);

    return from(
      addDoc(collectionRef, recipe).then(async (docRef) => {
        await setDoc(docRef, {...recipe, id: docRef.id});
        return docRef.id;
      })
    );
  }

  cloneRecipe(recipe: Recipe): Observable<string> {
    const userId = this.authService.currentUser?.uid;

    const recipeCloned = {...recipe};
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
    const recipesCollection = DatabaseCollectionsNames.recipes;
    const docRef = doc(this.firestore, `${recipesCollection}/${recipe.id}`);

    updateDoc(docRef, {...recipe})
      .then(() => {
        result.next();
        result.complete();
      })
      .catch((error) => result.error(error));

    return result.asObservable();
  }

  getRecipeDetail(id: string | null): Observable<Recipe> {
    if (id === null) {
      throw new Error('RecipeId is mandatory');
    }

    const result = new Subject<Recipe>();
    const privateRecipeNameCollection = DatabaseCollectionsNames.recipes;
    const collectionRef = collection(this.firestore, privateRecipeNameCollection);
    const queryData = query(collectionRef, where('id', '==', id));

    getDocs(queryData).then((querySnapshot) => {
      if (querySnapshot.empty) {
        this.router.navigate([AppRoutingNames.recipes]);
        throw new Error('Recipe does not exists');
      }

      const doc = querySnapshot.docs[0];
      const docData = doc.data();
      const recipe = this.recipesConverter(docData, doc.id);
      result.next(recipe);
    })

    return result;
  }

  deleteRecipe(id: string): Observable<boolean> {
    if (this.authService.isDemoUser) {
      throw new Error('You can not delete a recipe with demo user');
    }

    const result = new Subject<boolean>();
    const recipesCollection = DatabaseCollectionsNames.recipes;
    const docRef = doc(this.firestore, `${recipesCollection}/${id}`);

    deleteDoc(docRef)
      .then(() => {
        result.next(true);
        result.complete();
      })
      .catch((error) => result.error(error));

    return result.asObservable();
  }

  uploadFileAndGetMetadata(mediaFolderPath: string, fileToUpload: File): FilesUploadMetadata {
    if (this.authService.isDemoUser) {
      throw new Error('You can not upload a picture with demo user');
    }
    const {name} = fileToUpload;
    const filePath = `${mediaFolderPath}/${new Date().getTime()}_${name}`;
    const storageRef = ref(this.storage as unknown as FirebaseStorage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    const uploadProgress$ = new Observable<number | undefined>((observer) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          observer.next(progress);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });

    const downloadUrl$ = from(
      uploadTask.then(() => getDownloadURL(storageRef))
    ) as Observable<string>;

    return {
      uploadProgress$,
      downloadUrl$,
    };
  }

  deleteImage(imageUrl: string): Observable<any> {
    if (this.authService.isDemoUser) {
      throw new Error('You can not do this with demo user');
    }

    if (imageUrl === DEFAULT_IMAGE) {
      return of(true);
    }

    const storageRef = ref(this.storage, imageUrl);
    return from(deleteObject(storageRef));
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
}

