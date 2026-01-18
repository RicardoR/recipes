import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {Firestore} from '@angular/fire/firestore';
import {Storage} from '@angular/fire/storage';
import {RecipeService} from './recipe.service';
import {AuthService} from 'src/app/core/auth/services/auth.service';
import {recipeMock, recipeMock2} from 'src/app/testing-resources/mocks/recipe-mock';
import {userMock} from '../../../../testing-resources/mocks/user-mock';
import {Recipe} from '../../models/recipes.model';
import {of} from 'rxjs';

describe('RecipeService', () => {
  let service: RecipeService;
  let authService: AuthService;

  const mockAuthService = {
    currentUser: userMock,
    isDemoUser: false,
  };
  const mockFirestore = {} as Firestore;
  const mockStorage = {} as Storage;
  const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecipeService,
        {provide: AuthService, useValue: mockAuthService},
        {provide: Firestore, useValue: mockFirestore},
        {provide: Storage, useValue: mockStorage},
        {provide: Router, useValue: mockRouter},
      ]
    });

    service = TestBed.inject(RecipeService);
    authService = TestBed.inject(AuthService);
  });

  describe('When user is authenticated', () => {
    beforeEach(() => {
      authService.currentUser = { ...userMock, email: 'test@mail.com', uid: 'test-user-123' };
    });

    it('should get only own recipes', (done) => {
      spyOn(service, 'getOwnRecipes').and.returnValue(
        of([
          {...recipeMock, ownerId: authService.currentUser?.uid, id: 'recipe-1'}
        ])
      );

      service.getOwnRecipes().subscribe((recipes) => {
        expect(recipes.length).toBeGreaterThan(0);
        expect(recipes.every(recipe => recipe.ownerId === authService.currentUser?.uid)).toBeTrue();
        done();
      });
    });

    it('should get categories', (done) => {
      spyOn(service, 'getCategories').and.returnValue(
        of([
          {id: 1, detail: 'Categoria de verduras'},
          {id: 2, detail: 'Categoria de frutas'}
        ])
      );

      service.getCategories().subscribe((categories) => {
        expect(Array.isArray(categories)).toBeTrue();
        expect(categories.length).toBeGreaterThan(0);
        expect(categories[0].id).toBeDefined();
        expect(categories[0].detail).toBeDefined();
        done();
      });
    });

    it('should get public recipes with at least one recipe not owned by current user and at least one owned by current user', (done) => {
      const myRecipe = {...recipeMock, ownerId: authService.currentUser?.uid, id: 'recipe-1', private: false};
      const otherRecipe = {...recipeMock2, ownerId: 'other-user-id', id: 'recipe-2', private: false};

      spyOn(service, 'getPublicRecipes').and.returnValue(of([myRecipe, otherRecipe]));

      service.getPublicRecipes().subscribe((recipes) => {
        expect(Array.isArray(recipes)).toBeTrue();
        expect(recipes.length).toBeGreaterThan(0);
        const hasOtherOwner = recipes.some(recipe => recipe.ownerId !== authService.currentUser?.uid);
        expect(hasOtherOwner).toBeTrue();
        const hasCurrentUser = recipes.some(recipe => recipe.ownerId === authService.currentUser?.uid);
        expect(hasCurrentUser).toBeTrue();
        done();
      });
    });

    it('should clone a recipe and assign it to the current user', (done) => {
      const originalRecipe: Recipe = {...recipeMock2, ownerId: 'external-user-id', id: 'recipe-2', private: false};
      const clonedRecipe = {...originalRecipe, ownerId: authService.currentUser?.uid, id: 'cloned-recipe'};

      spyOn(service, 'cloneRecipe').and.returnValue(of('cloned-recipe'));
      spyOn(service, 'getOwnRecipes').and.returnValue(of([clonedRecipe]));

      service.cloneRecipe(originalRecipe).subscribe((id) => {
        expect(id).toBeDefined();
        service.getOwnRecipes().subscribe((recipes) => {
          const cloned = recipes.find(r => r.title === originalRecipe.title && r.ownerId === authService.currentUser?.uid);
          expect(cloned).toBeDefined();
          expect(cloned?.id).not.toEqual(originalRecipe.id);
          expect(cloned?.title).toEqual(originalRecipe.title);
          expect(cloned?.description).toEqual(originalRecipe.description);
          done();
        });
      });
    });

    it('should update a recipe', (done) => {
      const myRecipe = {...recipeMock, ownerId: authService.currentUser?.uid, id: 'recipe-1', private: false};
      const updatedRecipe = {...myRecipe, title: 'Updated Title', description: 'Updated Description'};

      spyOn(service, 'updateRecipe').and.returnValue(of(void 0));
      spyOn(service, 'getRecipeDetail').and.returnValue(of(updatedRecipe));

      service.updateRecipe(updatedRecipe).subscribe(() => {
        service.getRecipeDetail('recipe-1').subscribe((updated) => {
          expect(updated.title).toEqual('Updated Title');
          expect(updated.description).toEqual('Updated Description');
          expect(updated.id).toEqual('recipe-1');
          done();
        });
      });
    });

    it('should get recipe detail', (done) => {
      const myRecipe = {...recipeMock, ownerId: authService.currentUser?.uid, id: 'recipe-1', private: false};

      spyOn(service, 'getRecipeDetail').and.returnValue(of(myRecipe));

      service.getRecipeDetail('recipe-1').subscribe((recipe) => {
        expect(recipe).toBeDefined();
        expect(recipe.id).toEqual('recipe-1');
        expect(recipe.title).toEqual(myRecipe.title);
        expect(recipe.description).toEqual(myRecipe.description);
        expect(recipe.ownerId).toEqual(myRecipe.ownerId);
        done();
      });
    });

    it('should delete a recipe', (done) => {
      spyOn(service, 'deleteRecipe').and.returnValue(of(true));

      service.deleteRecipe('recipe-1').subscribe((result) => {
        expect(result).toBeTrue();
        done();
      });
    });

    it('should upload a file and get metadata', (done) => {
      const file = new File([new Blob(['test content'], {type: 'text/plain'})], 'test.txt', {type: 'text/plain'});
      const mockUrl = 'https://example.com/image.jpg';

      spyOn(service, 'uploadFileAndGetMetadata').and.returnValue({
        uploadProgress$: of(100),
        downloadUrl$: of(mockUrl)
      });

      const {uploadProgress$, downloadUrl$} = service.uploadFileAndGetMetadata('test-folder', file);

      let progressEmitted = false;
      let urlEmitted = false;

      uploadProgress$.subscribe((progress) => {
        progressEmitted = true;
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      });

      downloadUrl$.subscribe((url) => {
        urlEmitted = true;
        expect(typeof url).toBe('string');
        expect(url.length).toBeGreaterThan(0);
        if (progressEmitted && urlEmitted) done();
      });
    });

    it('should delete an image from storage', (done) => {
      spyOn(service, 'deleteImage').and.returnValue(of(void 0));

      service.deleteImage('https://example.com/image.jpg').subscribe((res) => {
        expect(res).toBeUndefined();
        done();
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

  describe('When user is demo', () => {
    beforeEach(() => {
      authService.currentUser = { ...userMock, email: 'test@mail.com', uid: 'demo-user' };
      mockAuthService.isDemoUser = true;
    });

    it('should throw error when trying to create a recipe', () => {
      expect(() => service.createRecipe(recipeMock)).toThrowError('You can not create a recipe with demo user');
    });

    it('should throw error when trying to update a recipe', () => {
      expect(() => service.updateRecipe(recipeMock)).toThrowError('You can not update a recipe with demo user');
    });

    it('should throw error when trying to delete a recipe', () => {
      expect(() => service.deleteRecipe('some-id')).toThrowError('You can not delete a recipe with demo user');
    });

    it('should throw error when trying to upload a file', () => {
      const file = new File([new Blob(['test content'], { type: 'text/plain' })], 'test.txt', { type: 'text/plain' });
      expect(() => service.uploadFileAndGetMetadata('folder', file)).toThrowError('You can not upload a picture with demo user');
    });

    it('should throw error when trying to delete an image', () => {
      expect(() => service.deleteImage('some-url')).toThrowError('You can not do this with demo user');
    });

    it('should allow filtering recipes', () => {
      const recipes = [
        { title: 'Tarta de Verduras', description: 'Rica tarta', id: '1', ownerId: 'a', steps: [], ingredients: [], imgSrc: '', private: false, categories: [], date: new Date() },
        { title: 'Ensalada', description: 'Fresca y saludable', id: '2', ownerId: 'b', steps: [], ingredients: [], imgSrc: '', private: false, categories: [], date: new Date() },
      ];
      const filtered = service.filterRecipes(recipes, 'tarta');
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('Tarta de Verduras');
    });
  });
});

