import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { DocumentChangeAction } from '@angular/fire/firestore/interfaces';
import { Observable, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { Recipe } from './../../models/recipes.model';
import { AuthService } from '../../../auth/services/auth.service';
import { MessagesService } from '../../../shared/services/messages/messages.service';

const enum DatabaseCollectionsNames {
  recipes = 'recipes',
  own = 'own'
}

@Injectable()
export class RecipeService {
  private userId?: string;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private messagesService: MessagesService
  ) {}

  getOwnRecipes(): Observable<any> {
    const result = new Subject<Recipe[]>();
    const privateRecipeNameCollection = this.getPrivateRecipeNameCollection();

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
      .subscribe(
        (recipes: Recipe[]) => result.next(recipes),
        (err) => this.messagesService.showSnackBar(err.message)
      );

    return result;
  }

  createRecipe(recipe: Recipe): Observable<void> {
    const result = new Subject<void>();
    const privateRecipeNameCollection = this.getPrivateRecipeNameCollection();

    this.firestore
      .collection(privateRecipeNameCollection)
      .add(recipe)
      .then(() => result.next())
      .catch((err) => {
        this.messagesService.showSnackBar(err.message);
        result.next();
      });

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
      .subscribe(
        (data) => {
          result.next(data);
          result.complete();
        },
        (err) => this.messagesService.showSnackBar('Error getting details', err)
      );

    return result;
  }

  private getPrivateRecipeNameCollection(): string {
    if (this.userId === undefined) {
      this.userId = this.authService.currentUser?.uid;
    }

    return `${DatabaseCollectionsNames.recipes}/${this.userId}/${DatabaseCollectionsNames.own}`;
  }

  private recipesConverter(docData: any, id: string): Recipe {
    if (docData === undefined) {
      this.messagesService.showSnackBar('Recipe does not exists');
      return {} as Recipe;
    }

    return {
      date: docData.date.toDate(),
      title: docData.title,
      description: docData.description,
      id: id,
    } as Recipe;
  }
}
