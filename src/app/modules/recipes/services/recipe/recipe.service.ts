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

  getRecipes(): Observable<any> {
    const result = new Subject<Recipe[]>();
    this.userId = this.authService.currentUser?.uid;

    this.firestore
      .collection(
        `${DatabaseCollectionsNames.recipes}/${this.userId}/${DatabaseCollectionsNames.own}`,
        (ref) => ref.orderBy('date', 'desc')
      )
      .stateChanges()
      .pipe(
        take(1),
        map((docArray: DocumentChangeAction<any>[]) => {
          return docArray.map((document: DocumentChangeAction<any>) => {
            const docData = document.payload.doc.data();
            return {
              date: docData.date.toDate(),
              title: docData.title,
              description: docData.description,
              id: document.payload.doc.id,
            } as Recipe;
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

    this.firestore
      .collection(
        `${DatabaseCollectionsNames.recipes}/${this.userId}/${DatabaseCollectionsNames.own}`
      )
      .add(recipe)
      .then(() => result.next())
      .catch((err) => {
        this.messagesService.showSnackBar(err.message);
        result.next();
      });

    return result;
  }

  getRecipeDetail(id: any): Observable<Recipe> {
    const result = new Subject<Recipe>();


    setTimeout(() => {
      result.next({
        title: 'title mock',
        description: 'description mock',
        date: new Date(),
      });
      result.complete();
    }, 200);


    return result;
  }
}
