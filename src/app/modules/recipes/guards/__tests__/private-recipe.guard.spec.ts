import {MessagesService} from '../../../shared/services/messages/messages.service';
import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, RouterModule} from '@angular/router';
import {BehaviorSubject} from 'rxjs';

import {AuthService} from 'src/app/modules/auth/services/auth.service';
import {RecipeService} from '../../services/recipe/recipe.service';
import {Recipe} from '../../models/recipes.model';
import {PrivateRecipeGuard} from '../private-recipe.guard';
import {RecipeListComponent} from '../../../shared/components/recipe-list/recipe-list.component';

describe('PrivateRecipeGuard', () => {
  let service: PrivateRecipeGuard;
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'getRecipeDetail',
  ]);
  const messagesServiceSpy = jasmine.createSpyObj('MessagesService', [
    'showSnackBar',
  ]);

  const route = {
    params: {},
  } as ActivatedRouteSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([
          {path: 'recipes', component: RecipeListComponent},
        ]),
      ],
      providers: [
        PrivateRecipeGuard,
        {provide: MessagesService, useValue: messagesServiceSpy},
        {provide: AuthService, useValue: authServiceSpy},
        {provide: RecipeService, useValue: recipeServiceSpy},
      ],
    });
    service = TestBed.inject(PrivateRecipeGuard);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('If recipe is not private should alow', () => {
    const recipeMocked = {
      id: '1',
      title: 'test',
      private: false,
    } as Recipe;
    recipeServiceSpy.getRecipeDetail.and.returnValue(
      new BehaviorSubject(recipeMocked)
    );
    service.canActivate(route).subscribe((res) => {
      expect(res).toBeTruthy();
    });
  });

  it('If the user is the owner should allow', () => {
    authServiceSpy.currentUser = {uid: '1'};
    const recipeMocked = {
      id: '1',
      title: 'test',
      private: true,
      ownerId: '1',
    } as Recipe;

    recipeServiceSpy.getRecipeDetail.and.returnValue(
      new BehaviorSubject(recipeMocked)
    );

    service.canActivate(route).subscribe((res) => {
      expect(res).toBeTruthy();
    });
  });

  it('If the recipe is private and the user is not the owner should not allow', (done) => {
    authServiceSpy.currentUser = {uid: '2'};
    const recipeMocked = {
      id: '1',
      title: 'test',
      private: true,
      ownerId: '1',
    } as Recipe;

    recipeServiceSpy.getRecipeDetail.and.returnValue(
      new BehaviorSubject(recipeMocked)
    );
    done();

    service.canActivate(route).subscribe((res) => {
      expect(res).toBeFalsy();
    });
  });
});
