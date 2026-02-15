import {ComponentFixture, TestBed} from '@angular/core/testing';
import {vi} from 'vitest';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {AuthService} from 'src/app/core/auth/services/auth.service';
import {recipesListMock} from 'src/app/testing-resources/mocks/recipes-list-mock';
import {userMock} from 'src/app/testing-resources/mocks/user-mock';
import {RecipeService} from '../../services/recipe/recipe.service';
import {MyRecipesComponent} from './my-recipes.component';
import {AnalyticsService} from '../../../../shared/services/analytics/analytics.service';
import {ToolbarService} from "../../../../shared/services/toolbar/toolbar.service";

describe('MyRecipesComponent', () => {
  let component: MyRecipesComponent;
  let fixture: ComponentFixture<MyRecipesComponent>;
  let toolbarService: ToolbarService;

  const routerSpy = {
    navigate: vi.fn().mockName("Router.navigate")
  };
  const recipeServiceSpy = {
    deleteRecipe: vi.fn().mockName("RecipeService.deleteRecipe"),
    deleteImage: vi.fn().mockName("RecipeService.deleteImage"),
    getOwnRecipes: vi.fn().mockName("RecipeService.getOwnRecipes"),
    filterRecipes: vi.fn().mockName("RecipeService.filterRecipes")
  };
  const authServiceSpy = {
    currentUser: vi.fn().mockName("AuthService.currentUser")
  };
  const matDialogSpy = {
    open: vi.fn().mockName("MatDialog.open")
  };
  const analyticsSpy = {
    sendToAnalytics: vi.fn().mockName("AnalyticsService.sendToAnalytics")
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MyRecipesComponent],
      providers: [
        {provide: Router, useValue: routerSpy},
        {provide: RecipeService, useValue: recipeServiceSpy},
        {provide: AuthService, useValue: authServiceSpy},
        {provide: MatDialog, useValue: matDialogSpy},
        {provide: AnalyticsService, useValue: analyticsSpy},
      ],
    }).overrideTemplate(MyRecipesComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyRecipesComponent);
    component = fixture.componentInstance;
    toolbarService = TestBed.inject(ToolbarService);

    recipeServiceSpy.getOwnRecipes.mockReturnValue(of(recipesListMock));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    authServiceSpy.currentUser = userMock;
    fixture.detectChanges();
  });

  describe('ngOnInit', () => {
    it('should get recipes', () => {
      expect(recipeServiceSpy.getOwnRecipes).toHaveBeenCalled();
      expect(component.recipesFiltered).toEqual(recipesListMock);
    });

    it('should get the current userId', () => {
      expect(component.userId).toEqual(userMock.uid);
    });
  });

  it('goToRecipe should navigate to the desired recipe', () => {
    component.goToRecipe(recipesListMock[0]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/details', '1']);
  });

  describe('deleteRecipe', () => {
    beforeEach(() => {
      recipeServiceSpy.deleteRecipe.mockClear();
      recipeServiceSpy.deleteImage.mockClear();
      recipeServiceSpy.getOwnRecipes.mockClear();
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
      expect(recipeServiceSpy.getOwnRecipes).toHaveBeenCalled();
    });

    it('should not delete the recipe when user cancel the dialog', () => {
      matDialogSpy.open.mockReturnValue({afterClosed: () => of(false)});

      component.deleteRecipe(recipesListMock[0]);
      expect(matDialogSpy.open).toHaveBeenCalled();

      expect(recipeServiceSpy.deleteRecipe).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteImage).not.toHaveBeenCalled();
      expect(recipeServiceSpy.getOwnRecipes).not.toHaveBeenCalled();
    });

    it('should not call to back end if a recipe doesnt have a recipe id', () => {
      const recipe = {...recipesListMock[0]};
      recipe.id = '';
      component.deleteRecipe(recipe);
      expect(matDialogSpy.open).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteRecipe).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteImage).not.toHaveBeenCalled();
      expect(recipeServiceSpy.getOwnRecipes).not.toHaveBeenCalled();
    });
  });

  it('should send my_recipes_component_opened event to analytics', () => {
    component.ngOnInit();
    expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('my_recipes_component_opened');
  });

  it('should trigger the search query when toolbarService emits a change', (() => {
    toolbarService.onSearch('my recipe');
    fixture.detectChanges();
    expect(recipeServiceSpy.filterRecipes).toHaveBeenCalled();
  }));
});
