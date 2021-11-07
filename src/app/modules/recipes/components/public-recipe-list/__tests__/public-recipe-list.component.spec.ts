import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { recipesListMocked, userMocked } from './recipes-list-mocked';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { RecipeService } from '../../../services/recipe/recipe.service';
import { PublicRecipeListComponent } from '../public-recipe-list.component';

describe('PublicRecipeListComponent', () => {
  let component: PublicRecipeListComponent;
  let fixture: ComponentFixture<PublicRecipeListComponent>;

  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'deleteRecipe',
    'deleteImage',
    'getPublicRecipes',
  ]);
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
  const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PublicRecipeListComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
      ],
    }).overrideTemplate(PublicRecipeListComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicRecipeListComponent);
    component = fixture.componentInstance;

    recipeServiceSpy.getPublicRecipes.and.returnValue(of(recipesListMocked));
    authServiceSpy.currentUser = userMocked;
    fixture.detectChanges();
  });

  describe('ngOnInit', () => {
    it('should get recipes', () => {
      expect(recipeServiceSpy.getPublicRecipes).toHaveBeenCalled();
      expect(component.recipes).toEqual(recipesListMocked);
    });

    it('should get the current userId', () => {
      expect(component.userId).toEqual(userMocked.uid);
    });
  });

  it('goToRecipe should navigate to the desired recipe', () => {
    component.goToRecipe(recipesListMocked[0]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/recipes/details', '1']);
  });

  describe('deleteRecipe', () => {
    beforeEach(() => {
      recipeServiceSpy.deleteRecipe.calls.reset();
      recipeServiceSpy.deleteImage.calls.reset();
      recipeServiceSpy.getPublicRecipes.calls.reset();
      matDialogSpy.open.calls.reset();
    });

    it('should delete the recipe when user confirm the dialog', () => {
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) });
      recipeServiceSpy.deleteRecipe.and.returnValue(of(true));
      recipeServiceSpy.deleteImage.and.returnValue(of(true));

      component.deleteRecipe(recipesListMocked[0]);
      expect(matDialogSpy.open).toHaveBeenCalled();
      expect(recipeServiceSpy.deleteRecipe).toHaveBeenCalledWith(
        recipesListMocked[0].id
      );
      expect(recipeServiceSpy.deleteImage).toHaveBeenCalledWith(
        recipesListMocked[0].imgSrc
      );
      expect(recipeServiceSpy.getPublicRecipes).toHaveBeenCalled();
    });

    it('should not delete the recipe when user cancel the dialog', () => {
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) });

      component.deleteRecipe(recipesListMocked[0]);
      expect(matDialogSpy.open).toHaveBeenCalled();

      expect(recipeServiceSpy.deleteRecipe).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteImage).not.toHaveBeenCalled();
      expect(recipeServiceSpy.getPublicRecipes).not.toHaveBeenCalled();
    });

    it('should not call to back end if a recipe doesnt have a recipe id', () => {

      const recipe = { ...recipesListMocked[0] };
      recipe.id = '';
      component.deleteRecipe(recipe);
      expect(matDialogSpy.open).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteRecipe).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteImage).not.toHaveBeenCalled();
      expect(recipeServiceSpy.getPublicRecipes).not.toHaveBeenCalled();
     });
  });
});
