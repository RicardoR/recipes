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
    private messagesService: MessagesService,
  ) { }


  getRecipes(): Observable<any> {
    const result = new Subject<Recipe[]>();
    this.userId = this.authService.currentUser?.uid;

    this.firestore
      .collection(
        `${DatabaseCollectionsNames.recipes}/${this.userId}/${DatabaseCollectionsNames.own}`,
        ref => ref.orderBy('date', 'desc')
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
            } as Recipe;
          });
        })
      )
      .subscribe(
        (recipes: Recipe[]) => result.next(recipes),
        (err) => this.messagesService.showSnackBar(err.message),
      );

    return result;
  }

  createRecipe() {
    this.firestore
      .collection(
        `${DatabaseCollectionsNames.recipes}/${this.userId}/${DatabaseCollectionsNames.own}`)
      .add({
        description: 'descripcion',
        title: 'titulo',
        date: new Date(),
      } as Recipe);
  }
}
