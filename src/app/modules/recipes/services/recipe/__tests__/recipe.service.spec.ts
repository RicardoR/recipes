import { TestBed } from '@angular/core/testing';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { of } from 'rxjs';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { recipesListMock } from 'src/app/__tests__/mocks/recipes-list-mock';
import { RecipeService } from '../recipe.service';

describe('RecipeService', () => {
  let service: RecipeService;

  const angularFirestoreSpy = jasmine.createSpyObj('AngularFirestore', [
    'collection',
  ]);
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
  const angularFireStorageSpy = jasmine.createSpyObj('AngularFireStorage', [
    'upload',
    'refFromURL',
    'ref'
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecipeService,
        { provide: AngularFirestore, useValue: angularFirestoreSpy },
        { provide: AngularFireStorage, useValue: angularFireStorageSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ]
    });
    service = TestBed.inject(RecipeService);
  });

  xit('getOwnRecipes should return the own recipes', () => {
    const collectionStub = {
      valueChanges: jasmine
        .createSpy('stateChanges')
        .and.returnValue(recipesListMock),
    };

    const userId = 'userId';
    authServiceSpy.currentUser.and.returnValue({ uid: userId });
    const recipes = [{ id: 'id' }];

    angularFirestoreSpy.collection.and.returnValue(of(collectionStub));
    service.getOwnRecipes().subscribe(recipesList => {
      expect(recipesList).toEqual(recipes);
    });

  });
});
