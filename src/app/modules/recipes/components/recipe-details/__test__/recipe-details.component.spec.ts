import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { RecipeService } from '../../../services/recipe/recipe.service';
import { RecipeDetailsComponent } from '../recipe-details.component';
import { recipeMock, userMocked } from './recipe-mock';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

describe('RecipeDetailsComponent', () => {
  let component: RecipeDetailsComponent;
  let fixture: ComponentFixture<RecipeDetailsComponent>;

  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'deleteRecipe',
    'deleteImage',
  ]);
  const activatedRouteStub = { data: of({ recipe: recipeMock }) };
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
  const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecipeDetailsComponent],
      providers: [
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
      ],
    }).overrideTemplate(RecipeDetailsComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeDetailsComponent);
    component = fixture.componentInstance;
    authServiceSpy.currentUser = userMocked;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getRecipeDetails should get the recipe details and determine if is the owner', () => {
    expect(component.recipeDetails).toEqual(recipeMock);
    expect(component.isOwnReceip).toBeFalsy();
  });

    describe('deleteRecipe', () => {
      beforeEach(() => {
        recipeServiceSpy.deleteRecipe.calls.reset();
        recipeServiceSpy.deleteImage.calls.reset();
        matDialogSpy.open.calls.reset();
        routerSpy.navigate.calls.reset();
      });

      it('should delete the recipe when user confirm the dialog', () => {
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) });
        recipeServiceSpy.deleteRecipe.and.returnValue(of(true));
        recipeServiceSpy.deleteImage.and.returnValue(of(true));

        component.deleteRecipe();
        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(recipeServiceSpy.deleteRecipe).toHaveBeenCalledWith(recipeMock.id);
        expect(recipeServiceSpy.deleteImage).toHaveBeenCalledWith(recipeMock.imgSrc);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes']);
      });

      it('should not delete the recipe when user cancel the dialog', () => {
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) });

        component.deleteRecipe();
        expect(matDialogSpy.open).toHaveBeenCalled();

        expect(recipeServiceSpy.deleteRecipe).not.toHaveBeenCalled();
        expect(recipeServiceSpy.deleteImage).not.toHaveBeenCalled();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
      });
    });

    describe('editRecipe', () => {
      it('should navigate to edit recipe page when recipe has an id', () => {
        component.editRecipe();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/edit', recipeMock.id]);
      });

      it('should no navigate to edit page if recipe id is not present', () => {
        routerSpy.navigate.calls.reset();
        component.recipeDetails.id = '';
        component.editRecipe();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
      });
    });
});
