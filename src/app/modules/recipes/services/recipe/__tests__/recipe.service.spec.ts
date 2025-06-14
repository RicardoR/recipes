import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {of} from 'rxjs';
import {RecipeService} from '../recipe.service';
import {AuthService} from 'src/app/modules/auth/services/auth.service';
import {recipeMock} from 'src/app/testing-resources/mocks/recipe-mock';
import {userMock} from 'src/app/testing-resources/mocks/user-mock';
import {Firestore} from '@angular/fire/firestore';
import {Storage} from '@angular/fire/storage';
import {ElementModel} from '../../../models/element.model';

describe('RecipeService', () => {
  let service: RecipeService;
  let firestoreMock: any;
  let storageMock: any;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    firestoreMock = {
      collection: jasmine.createSpy(),
      doc: jasmine.createSpy(),
    };
    storageMock = {};
    authServiceMock = {
      currentUser: userMock,
      isDemoUser: false,
    };
    routerMock = {navigate: jasmine.createSpy()};

    TestBed.configureTestingModule({
      providers: [
        RecipeService,
        {provide: Firestore, useValue: firestoreMock},
        {provide: Storage, useValue: storageMock},
        {provide: AuthService, useValue: authServiceMock},
        {provide: Router, useValue: routerMock},
      ],
    });
    service = TestBed.inject(RecipeService);
  });

  describe('when user is not a demo user', () => {
    beforeEach(() => {
      authServiceMock.isDemoUser = false;
    });

    it('should create a recipe', (done) => {
      const addDocSpy = spyOn<any>(service, 'createRecipe').and.returnValue(of('123'));
      service.createRecipe(recipeMock).subscribe((id) => {
        expect(id).toBe('123');
        expect(addDocSpy).toHaveBeenCalled();
        done();
      });
    });

    it('should update a recipe', (done) => {
      const updateDocSpy = spyOn<any>(service, 'updateRecipe').and.returnValue(of(void 0));
      service.updateRecipe(recipeMock).subscribe(() => {
        expect(updateDocSpy).toHaveBeenCalled();
        done();
      });
    });

    it('should delete a recipe', (done) => {
      const deleteDocSpy = spyOn<any>(service, 'deleteRecipe').and.returnValue(of(true));
      service.deleteRecipe('id').subscribe((res) => {
        expect(res).toBeTrue();
        expect(deleteDocSpy).toHaveBeenCalled();
        done();
      });
    });

    it('should get recipe detail', (done) => {
      const recipe = {...recipeMock, id: 'id'};
      spyOn<any>(service, 'getRecipeDetail').and.returnValue(of(recipe));
      service.getRecipeDetail('id').subscribe((res) => {
        expect(res.id).toBe('id');
        done();
      });
    });

    it('should filter recipes', () => {
      const recipes = [recipeMock];
      const filtered = service.filterRecipes(recipes, recipeMock.title);
      expect(filtered.length).toBe(1);
    });

    it('should get own recipes', (done) => {
      const recipes = [recipeMock];
      spyOn(service, 'getOwnRecipes').and.returnValue(of(recipes));
      service.getOwnRecipes().subscribe((res) => {
        expect(res.length).toBe(1);
        done();
      });
    });

    it('should get categories', (done) => {
      const categories: ElementModel[] = [{ id: 1, detail: 'Category 1' }];
      spyOn(service, 'getCategories').and.returnValue(of(categories));
      service.getCategories().subscribe((res) => {
        expect(res.length).toBe(1);
        expect(res[0].id).toBe(1);
        done();
      });
    });

    it('should get public recipes', (done) => {
      const recipes = [recipeMock];
      spyOn(service, 'getPublicRecipes').and.returnValue(of(recipes));
      service.getPublicRecipes().subscribe((res) => {
        expect(res.length).toBe(1);
        done();
      });
    });

    it('should clone a recipe', (done) => {
      const cloneId = 'cloned123';
      spyOn(service, 'cloneRecipe').and.returnValue(of(cloneId));
      service.cloneRecipe(recipeMock).subscribe((id) => {
        expect(id).toBe(cloneId);
        done();
      });
    });
  });

  describe('when user is a demo user', () => {
    beforeEach(() => {
      authServiceMock.isDemoUser = true;
    });

    it('should not create a recipe', () => {
      expect(() => service.createRecipe(recipeMock)).toThrow();
    });

    it('should not update a recipe', () => {
      expect(() => service.updateRecipe(recipeMock)).toThrow();
    });

    it('should not delete a recipe', () => {
      expect(() => service.deleteRecipe('id')).toThrow();
    });

    it('should not upload file and get metadata', () => {
      expect(() => service.uploadFileAndGetMetadata('images', new File([], 'test.png'))).toThrow();
    });

    it('should not delete image', () => {
      expect(() => service.deleteImage('someurl')).toThrow();
    });

    it('should not clone a recipe', () => {
      expect(() => service.cloneRecipe(recipeMock)).toThrow();
    });
  });
});
