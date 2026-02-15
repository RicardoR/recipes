import {ComponentFixture, TestBed} from '@angular/core/testing';
import {vi} from 'vitest';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {BehaviorSubject, of} from 'rxjs';

import {AuthService} from 'src/app/core/auth/services/auth.service';
import {recipesListMock} from 'src/app/testing-resources/mocks/recipes-list-mock';
import {userMock} from 'src/app/testing-resources/mocks/user-mock';
import {RecipeService} from '../../services/recipe/recipe.service';
import {PublicRecipeListComponent} from './public-recipe-list.component';
import {AnalyticsService} from '../../../../shared/services/analytics/analytics.service';
import {ToolbarService} from "../../../../shared/services/toolbar/toolbar.service";

describe('PublicRecipeListComponent', () => {
  let component: PublicRecipeListComponent;
  let fixture: ComponentFixture<PublicRecipeListComponent>;
  let toolbarService: ToolbarService;

  const routerSpy = {
    navigate: vi.fn().mockName("Router.navigate")
  };
  const recipeServiceSpy = {
    deleteRecipe: vi.fn().mockName("RecipeService.deleteRecipe"),
    deleteImage: vi.fn().mockName("RecipeService.deleteImage"),
    getPublicRecipes: vi.fn().mockName("RecipeService.getPublicRecipes"),
    cloneRecipe: vi.fn().mockName("RecipeService.cloneRecipe"),
    filterRecipes: vi.fn().mockName("RecipeService.filterRecipes")
  };
  const authServiceSpy = {
    currentUser: vi.fn().mockName("AuthService.currentUser"),
    logoutSuccess$: vi.fn().mockName("AuthService.logoutSuccess$")
  };
  const matDialogSpy = {
    open: vi.fn().mockName("MatDialog.open")
  };
  const analyticsSpy = {
    sendToAnalytics: vi.fn().mockName("AnalyticsService.sendToAnalytics")
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PublicRecipeListComponent],
      providers: [
        {provide: Router, useValue: routerSpy},
        {provide: RecipeService, useValue: recipeServiceSpy},
        {provide: AuthService, useValue: authServiceSpy},
        {provide: MatDialog, useValue: matDialogSpy},
        {provide: AnalyticsService, useValue: analyticsSpy},
      ],
    }).overrideTemplate(PublicRecipeListComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicRecipeListComponent);
    component = fixture.componentInstance;
    toolbarService = TestBed.inject(ToolbarService);

    recipeServiceSpy.getPublicRecipes.mockReturnValue(of(recipesListMock));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    authServiceSpy.currentUser = userMock;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    authServiceSpy.logoutSuccess$ = new BehaviorSubject<void>(undefined);
    fixture.detectChanges();
  });

  describe('ngOnInit', () => {
    it('should get recipes', () => {
      expect(recipeServiceSpy.getPublicRecipes).toHaveBeenCalled();
      expect(component.recipesFiltered).toEqual(recipesListMock);
    });

    it('should get the current userId', () => {
      expect(component.userId).toEqual(userMock.uid);
    });
  });

  it('goToRecipe should navigate to the desired recipe', () => {
    component.goToRecipe(recipesListMock[0]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/recipes/details', '1']);
  });

  describe('deleteRecipe', () => {
    beforeEach(() => {
      recipeServiceSpy.deleteRecipe.mockClear();
      recipeServiceSpy.deleteImage.mockClear();
      recipeServiceSpy.getPublicRecipes.mockClear();
      matDialogSpy.open.mockClear();
    });

    it('should delete the recipe when user confirm the dialog', () => {
      matDialogSpy.open.mockReturnValue({afterClosed: () => of(true)});
      recipeServiceSpy.deleteRecipe.mockReturnValue(of(true));
      recipeServiceSpy.deleteImage.mockReturnValue(of(true));

      component.deleteRecipe(recipesListMock[0]);
      expect(matDialogSpy.open).toHaveBeenCalled();
      expect(recipeServiceSpy.deleteRecipe).toHaveBeenCalledWith(recipesListMock[0].id);
      expect(recipeServiceSpy.deleteImage).toHaveBeenCalledWith(recipesListMock[0].imgSrc);
      expect(recipeServiceSpy.getPublicRecipes).toHaveBeenCalled();
    });

    it('should not delete the recipe when user cancel the dialog', () => {
      matDialogSpy.open.mockReturnValue({afterClosed: () => of(false)});

      component.deleteRecipe(recipesListMock[0]);
      expect(matDialogSpy.open).toHaveBeenCalled();

      expect(recipeServiceSpy.deleteRecipe).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteImage).not.toHaveBeenCalled();
      expect(recipeServiceSpy.getPublicRecipes).not.toHaveBeenCalled();
    });

    it('should not call to back end if a recipe doesnt have a recipe id', () => {
      const recipe = {...recipesListMock[0]};
      recipe.id = '';
      component.deleteRecipe(recipe);
      expect(matDialogSpy.open).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteRecipe).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteImage).not.toHaveBeenCalled();
      expect(recipeServiceSpy.getPublicRecipes).not.toHaveBeenCalled();
    });
  });

  describe('cloneRecipe', () => {
    it('should send analytics, call cloneRecipe and navigate to edit', () => {
      const recipe = recipesListMock[0];
      const clonedRecipeId = 'cloned-id';
      recipeServiceSpy.cloneRecipe.mockReturnValue(of(clonedRecipeId));

      component.cloneRecipe(recipe);

      expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('public_recipe_cloned', {recipeId: recipe.id});
      expect(recipeServiceSpy.cloneRecipe).toHaveBeenCalledWith(recipe);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/edit', clonedRecipeId]);
    });
  });

  it('should log the event when component is started', () => {
    expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('public_recipes_component_opened');
  });

  it('should trigger the search query when toolbarService emits a change', (() => {
    toolbarService.onSearch('my recipe');
    fixture.detectChanges();
    expect(recipeServiceSpy.filterRecipes).toHaveBeenCalled();
  }));
});
