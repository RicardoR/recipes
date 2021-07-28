import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

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
  ) { }

  getRecipes(): void {
    this.userId = this.authService.currentUser?.uid;

    this.firestore
      .collection(
        `${DatabaseCollectionsNames.recipes}/${this.userId}/${DatabaseCollectionsNames.own}`
      )
      .stateChanges()
      .pipe(take(1))
      .subscribe((data) => {
        data.forEach(d => {
          console.log('data', d.payload.doc.data());
        })
      });

  }

  createRecipe() {
    this.firestore
      .collection(`${DatabaseCollectionsNames.recipes}/${this.userId}/${DatabaseCollectionsNames.own}`)
      .add({
        description: 'descripcion',
        title: 'titulo',
        date: new Date(),
      });
  }
}
