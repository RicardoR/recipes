import {TestBed} from '@angular/core/testing';
import {RouterModule} from '@angular/router';
import {environment} from 'src/environments/environment.test';
import {RecipeService} from '../recipe.service';
import {AuthService} from 'src/app/modules/auth/services/auth.service';
import {recipeMock, recipeMock2} from 'src/app/testing-resources/mocks/recipe-mock';
import {provideFirebaseApp} from '@angular/fire/app';
import {addDoc, collection, getFirestore, provideFirestore} from '@angular/fire/firestore';
import {getStorage, provideStorage} from '@angular/fire/storage';
import {initializeApp} from 'firebase/app';
import {AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS} from "@angular/fire/compat";
import {connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword} from 'firebase/auth';
import {firstValueFrom, switchMap} from 'rxjs';
import {userMock} from "../../../../../testing-resources/mocks/user-mock";


describe('RecipeService E2E', () => {
  let service: RecipeService;
  let authService: AuthService;
  let auth: ReturnType<typeof getAuth>;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([]),
        AngularFireModule.initializeApp(environment.firebase)
      ],
      providers: [
        RecipeService,
        AuthService,
        {provide: FIREBASE_OPTIONS, useValue: environment.firebase},
        {provide: FIREBASE_APP_NAME, useValue: undefined},
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => getFirestore()),
        provideStorage(() => getStorage())
      ]
    }).compileComponents();

    service = TestBed.inject(RecipeService);
    authService = TestBed.inject(AuthService);
    await userSetup();
  });

  it('should get only own recipes (E2E with Firestore emulator)', (done) => {
    const myRecipe = {...recipeMock, ownerId: auth.currentUser?.uid || 'test-user', id: ''};
    const otherRecipe = {...recipeMock2, ownerId: "a5690465-5e1b-459a-9798-cdf856bae7bd", id: ''};

    service
      .createRecipe(otherRecipe)
      .pipe(
        switchMap(() => service.createRecipe(myRecipe)),
        switchMap(() => service.getOwnRecipes())
      )
      .subscribe((recipes) => {
        expect(Array.isArray(recipes)).toBeTrue();
        expect(recipes.length).toBeGreaterThan(0);
        recipes.forEach((recipe) => {
          expect(recipe.ownerId).toEqual(auth.currentUser?.uid);
        });
        done();
      });
  });

  it('should get categories (E2E with Firestore emulator)', async () => {
    const firestore = getFirestore();
    const category = {id: 'cat1', name: 'Verduras', detail: 'Categoria de verduras'};
    await addDoc(collection(firestore, 'categories'), category);
    const categories = await firstValueFrom(service.getCategories());
    expect(Array.isArray(categories)).toBeTrue();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].id).toBeDefined();
    expect(categories[0].detail).toBeDefined();
  });


  async function userSetup() {
    auth = getAuth();
    connectAuthEmulator(auth, 'http://localhost:9099');

    try {
      await createUserWithEmailAndPassword(auth, userMock.email, userMock.password);
    } catch (e: any) {
      if (e.code !== 'auth/email-already-in-use') throw e;
    }

    await signInWithEmailAndPassword(auth, userMock.email, userMock.password);
    authService.currentUser = {...userMock, uid: auth.currentUser?.uid};
  }

});
