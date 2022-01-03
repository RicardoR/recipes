import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { recipesListMock } from 'src/app/__tests__/mocks/recipes-list-mock';
import { userMock } from 'src/app/__tests__/mocks/user-mock';
import { RecipeService } from '../../../services/recipe/recipe.service';
import { MyRecipesComponent } from '../my-recipes.component';

describe('MyRecipesComponent', () => {
  let component: MyRecipesComponent;
  let fixture: ComponentFixture<MyRecipesComponent>;

  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'deleteRecipe',
    'deleteImage',
    'getOwnRecipes',
  ]);
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
  const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
  const firebaseAnalycitsSpy = jasmine.createSpyObj('AngularFireAnalytics', [
    'logEvent',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyRecipesComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: AngularFireAnalytics, useValue: firebaseAnalycitsSpy },
      ],
    }).overrideTemplate(MyRecipesComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyRecipesComponent);
    component = fixture.componentInstance;

    recipeServiceSpy.getOwnRecipes.and.returnValue(of(recipesListMock));
    authServiceSpy.currentUser = userMock;
    fixture.detectChanges();
  });

  describe('ngOnInit', () => {
    it('should get recipes', () => {
      expect(recipeServiceSpy.getOwnRecipes).toHaveBeenCalled();
      expect(component.recipes).toEqual(recipesListMock);
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
      recipeServiceSpy.deleteRecipe.calls.reset();
      recipeServiceSpy.deleteImage.calls.reset();
      recipeServiceSpy.getOwnRecipes.calls.reset();
      matDialogSpy.open.calls.reset();
    });

    it('should delete the recipe when user confirm the dialog', () => {
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) });
      recipeServiceSpy.deleteRecipe.and.returnValue(of(true));
      recipeServiceSpy.deleteImage.and.returnValue(of(true));

      component.deleteRecipe(recipesListMock[0]);
      expect(matDialogSpy.open).toHaveBeenCalled();
      expect(recipeServiceSpy.deleteRecipe).toHaveBeenCalledWith(recipesListMock[0].id);
      expect(recipeServiceSpy.deleteImage).toHaveBeenCalledWith(recipesListMock[0].imgSrc);
      expect(recipeServiceSpy.getOwnRecipes).toHaveBeenCalled();
    });

    it('should not delete the recipe when user cancel the dialog', () => {
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) });

      component.deleteRecipe(recipesListMock[0]);
      expect(matDialogSpy.open).toHaveBeenCalled();

      expect(recipeServiceSpy.deleteRecipe).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteImage).not.toHaveBeenCalled();
      expect(recipeServiceSpy.getOwnRecipes).not.toHaveBeenCalled();
    });

    it('should not call to back end if a recipe doesnt have a recipe id', () => {
      const recipe = { ...recipesListMock[0] };
      recipe.id = '';
      component.deleteRecipe(recipe);
      expect(matDialogSpy.open).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteRecipe).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteImage).not.toHaveBeenCalled();
      expect(recipeServiceSpy.getOwnRecipes).not.toHaveBeenCalled();
    });
  });

  it('should send my_recipes_component_opened event to analytics', () => {
    expect(firebaseAnalycitsSpy.logEvent).toHaveBeenCalledWith('my_recipes_component_opened');
  });
});
