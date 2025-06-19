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
import {Recipe} from "../../../models/recipes.model";
import {RecipeListComponent} from "../../../../shared/components/recipe-list/recipe-list.component";


describe('RecipeService E2E', () => {
  let service: RecipeService;
  let authService: AuthService;
  let auth: ReturnType<typeof getAuth>;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([{path: 'recipes', component: RecipeListComponent}]),
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
  });

  describe('When user is authenticated', () => {
    beforeEach(async () => {
      await userSetup();
    });

    it('should get only own recipes', (done) => {
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
          expect(recipes.every(recipe => recipe.ownerId === auth.currentUser?.uid)).toBeTrue();
          done();
        });
    });

    it('should get categories', async () => {
      const firestore = getFirestore();
      const category = {id: 'cat1', name: 'Verduras', detail: 'Categoria de verduras'};
      await addDoc(collection(firestore, 'categories'), category);
      const categories = await firstValueFrom(service.getCategories());
      expect(Array.isArray(categories)).toBeTrue();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0].id).toBeDefined();
      expect(categories[0].detail).toBeDefined();
    });

    it('should get public recipes with at least one recipe not owned by current user and at least one owned by current user', (done) => {
      const myRecipe = {...recipeMock, ownerId: auth.currentUser?.uid || 'test-user', id: '', private: false};
      const otherRecipe = {...recipeMock2, ownerId: 'a5690465-5e1b-459a-9798-cdf856bae7bd', id: '', private: false};

      service
        .createRecipe(myRecipe)
        .pipe(
          switchMap(() => service.createRecipe(otherRecipe)),
          switchMap(() => service.getPublicRecipes())
        )
        .subscribe((recipes) => {
          expect(Array.isArray(recipes)).toBeTrue();
          expect(recipes.length).toBeGreaterThan(0);
          const hasOtherOwner = recipes.some(
            (recipe) => recipe.ownerId !== auth.currentUser?.uid
          );
          expect(hasOtherOwner).toBeTrue();
          const hasCurrentUser = recipes.some(
            (recipe) => recipe.ownerId === auth.currentUser?.uid
          );
          expect(hasCurrentUser).toBeTrue();
          done();
        });
    });

    it('should clone a recipe and assign it to the current user', (done) => {
      const originalRecipe: Recipe = {...recipeMock2, ownerId: 'external-user-id', id: '', private: false};
      service.createRecipe(originalRecipe)
        .pipe(
          switchMap(() => service.cloneRecipe(originalRecipe)),
          switchMap(() => service.getOwnRecipes())
        )
        .subscribe((recipes) => {
          const cloned = recipes.find(r => r.title === originalRecipe.title && r.ownerId === auth.currentUser?.uid);
          expect(cloned).toBeDefined();
          expect(cloned?.id).not.toEqual(originalRecipe.id);
          expect(cloned?.title).toEqual(originalRecipe.title);
          expect(cloned?.description).toEqual(originalRecipe.description);
          expect(cloned?.steps).toEqual(originalRecipe.steps);
          expect(cloned?.ingredients).toEqual(originalRecipe.ingredients);
          expect(cloned?.imgSrc).toEqual('assets/images/verduras.jpeg');
          expect(cloned?.private).toEqual(originalRecipe.private);
          done();
        });
    });

    it('should update a recipe', (done) => {
      const myRecipe = {...recipeMock, ownerId: auth.currentUser?.uid || 'test-user', id: '', private: false};
      let createdId: string;
      service.createRecipe(myRecipe)
        .pipe(
          switchMap((id) => {
            createdId = id;
            const updatedRecipe = {...myRecipe, id, title: 'Updated Title', description: 'Updated Description'};
            return service.updateRecipe(updatedRecipe);
          }),
          switchMap(() => service.getRecipeDetail(createdId))
        )
        .subscribe((updated) => {
          expect(updated.title).toEqual('Updated Title');
          expect(updated.description).toEqual('Updated Description');
          expect(updated.id).toEqual(createdId);
          done();
        });
    });

    it('should get recipe detail', (done) => {
      const myRecipe = {...recipeMock, ownerId: auth.currentUser?.uid || 'test-user', id: '', private: false};
      let createdId: string;
      service.createRecipe(myRecipe)
        .pipe(
          switchMap((id) => {
            createdId = id;
            return service.getRecipeDetail(createdId);
          })
        )
        .subscribe((recipe) => {
          expect(recipe).toBeDefined();
          expect(recipe.id).toEqual(createdId);
          expect(recipe.title).toEqual(myRecipe.title);
          expect(recipe.description).toEqual(myRecipe.description);
          expect(recipe.ownerId).toEqual(myRecipe.ownerId);
          done();
        });
    });

    it('should delete a recipe', (done) => {
      const myRecipe = {...recipeMock, ownerId: auth.currentUser?.uid || 'test-user', id: '', private: false};
      let createdId: string;
      service.createRecipe(myRecipe)
        .pipe(
          switchMap((id) => {
            createdId = id;
            return service.deleteRecipe(createdId);
          }),
          switchMap(() => service.getRecipeDetail(createdId))
        )
        .subscribe({
          next: () => {
            fail('Recipe should have been deleted');
            done();
          },
          error: (err) => {
            expect(err).toBeDefined();
            expect(err.message).toContain('Recipe does not exists');

            done();
          }
        });
    });

    it('should upload a file and get metadata', (done) => {
      const file = new File([new Blob(['test content'], {type: 'text/plain'})], 'test.txt', {type: 'text/plain'});
      const folder = 'test-uploads';
      const {uploadProgress$, downloadUrl$} = service.uploadFileAndGetMetadata(folder, file);

      let progressEmitted = false;
      let urlEmitted = false;

      uploadProgress$.subscribe({
        next: (progress) => {
          progressEmitted = true;
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(100);
        },
        error: (err) => fail(err)
      });

      downloadUrl$.subscribe({
        next: (url) => {
          urlEmitted = true;
          expect(typeof url).toBe('string');
          expect(url.length).toBeGreaterThan(0);
          if (progressEmitted && urlEmitted) done();
        },
        error: (err) => fail(err)
      });
    });

    it('should delete an image from storage', (done) => {
      const file = new File([new Blob(['test content'], {type: 'text/plain'})], 'test.txt', {type: 'text/plain'});
      const folder = 'test-uploads';
      const {downloadUrl$} = service.uploadFileAndGetMetadata(folder, file);

      downloadUrl$
        .pipe(
          switchMap((url) => service.deleteImage(url))
        )
        .subscribe({
          next: (res) => {
            expect(res).toBeUndefined();
            done();
          },
          error: (err) => fail(err)
        });
    });

    it('should filter recipes by title or description', () => {
      const recipes = [
        {
          title: 'Tarta de Verduras',
          description: 'Rica tarta',
          id: '1',
          ownerId: 'a',
          steps: [],
          ingredients: [],
          imgSrc: '',
          private: false,
          categories: [],
          date: new Date()
        },
        {
          title: 'Ensalada',
          description: 'Fresca y saludable',
          id: '2',
          ownerId: 'b',
          steps: [],
          ingredients: [],
          imgSrc: '',
          private: false,
          categories: [],
          date: new Date()
        },
        {
          title: 'Pizza',
          description: 'Con mucha verdura',
          id: '3',
          ownerId: 'c',
          steps: [],
          ingredients: [],
          imgSrc: '',
          private: false,
          categories: [],
          date: new Date()
        },
      ];

      let filtered = service.filterRecipes(recipes, 'tarta');
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('Tarta de Verduras');

      filtered = service.filterRecipes(recipes, 'saludable');
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('Ensalada');

      filtered = service.filterRecipes(recipes, 'verdura');
      expect(filtered.length).toBe(2);
      expect(filtered.some(r => r.title === 'Tarta de Verduras')).toBeTrue();
      expect(filtered.some(r => r.title === 'Pizza')).toBeTrue();

      filtered = service.filterRecipes(recipes, '');
      expect(filtered.length).toBe(3);
    });

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
