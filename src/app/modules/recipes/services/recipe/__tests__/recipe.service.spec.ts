import { RouterTestingModule } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { of } from 'rxjs';

import { recipeMock } from 'src/app/testing-resources/mocks/recipe-mock';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { documentList } from 'src/app/testing-resources/mocks/firebase-documents-mock';
import { userMock } from 'src/app/testing-resources/mocks/user-mock';
import { RecipeService } from '../recipe.service';

describe('RecipeService', () => {
  let service: RecipeService;
  let authService: jasmine.SpyObj<AuthService>;
  let angularFirestore: jasmine.SpyObj<AngularFirestore>;

  beforeEach(() => {
    const angularFirestoreSpy = jasmine.createSpyObj('AngularFirestore', [
      'collection',
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
    const angularFireStorageSpy = jasmine.createSpyObj('AngularFireStorage', [
      'upload',
      'refFromURL',
      'ref',
    ]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        RecipeService,
        { provide: AngularFirestore, useValue: angularFirestoreSpy },
        { provide: AngularFireStorage, useValue: angularFireStorageSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
    service = TestBed.inject(RecipeService);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    angularFirestore = TestBed.inject(
      AngularFirestore
    ) as jasmine.SpyObj<AngularFirestore>;
  });

  it('getOwnRecipes should return the own recipes', () => {
    const collectionStub = {
      stateChanges: jasmine
        .createSpy('stateChanges')
        .and.returnValue(of(documentList)),
    } as unknown as AngularFirestoreCollection<unknown>;

    authService.currentUser = userMock;

    angularFirestore.collection.and.returnValue(collectionStub);
    service.getOwnRecipes().subscribe((recipesList) => {
      const recipeRetrieved = recipesList[0];
      const expectedRecipe = documentList[0].payload.doc.data();
      expect(recipeRetrieved.title).toEqual(expectedRecipe.title);
      expect(recipeRetrieved.description).toEqual(expectedRecipe.description);
      expect(recipeRetrieved.id).toEqual(expectedRecipe.id);
      expect(recipeRetrieved.ownerId).toEqual(expectedRecipe.ownerId);
      expect(recipeRetrieved.imgSrc).toEqual(expectedRecipe.imgSrc);
      expect(recipeRetrieved.private).toEqual(expectedRecipe.private);
      expect(recipeRetrieved.steps.length).toEqual(expectedRecipe.steps.length);
      expect(recipeRetrieved.ingredients.length).toEqual(
        expectedRecipe.ingredients.length
      );
    });
  });

  it('getPublicRecipes should return the public recipes', () => {
    const collectionStub = {
      stateChanges: jasmine
        .createSpy('stateChanges')
        .and.returnValue(of(documentList)),
    } as unknown as AngularFirestoreCollection<unknown>;

    angularFirestore.collection.and.returnValue(collectionStub);
    service.getPublicRecipes().subscribe((recipesList) => {
      expect(recipesList.length).toEqual(2);
    });
  });

  it('createRecipe should call to add method', () => {
    const collectionStub = {
      add: jasmine
        .createSpy('add')
        .and.returnValue(Promise.resolve({ data: '123er56' })),
    } as unknown as AngularFirestoreCollection<unknown>;

    angularFirestore.collection.and.returnValue(collectionStub);
    service.createRecipe(recipeMock);
    expect(collectionStub.add).toHaveBeenCalledWith(recipeMock);
  });

  it('updateRecipe should call to update method', () => {
    const updateStub = {
      update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
    };

    const collectionStub = {
      doc: jasmine.createSpy('doc').and.returnValue(updateStub),
    } as unknown as AngularFirestoreCollection<unknown>;

    angularFirestore.collection.and.returnValue(collectionStub);
    service.updateRecipe(recipeMock);
    expect(collectionStub.doc).toHaveBeenCalledWith(recipeMock.id);
  });

  it('getRecipeDetails should get the details', () => {
    const getStub = {
      get: jasmine
        .createSpy('get')
        .and.returnValue(of(documentList[0].payload.doc)),
    };
    const collectionStub = {
      doc: jasmine.createSpy('doc').and.returnValue(getStub),
    } as unknown as AngularFirestoreCollection<unknown>;

    angularFirestore.collection.and.returnValue(collectionStub);
    service.getRecipeDetail('id').subscribe();
    expect(collectionStub.doc).toHaveBeenCalledWith('id');
  });

  it('deleteRecipe should call to delete method', () => {
    const deleteSub = {
      delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
    };
    const collectionStub = {
      doc: jasmine.createSpy('doc').and.returnValue(deleteSub),
    } as unknown as AngularFirestoreCollection<unknown>;
    angularFirestore.collection.and.returnValue(collectionStub);
    service.deleteRecipe('id').subscribe();
    expect(collectionStub.doc).toHaveBeenCalledWith('id');
    expect(deleteSub.delete).toHaveBeenCalled();
  });
});
