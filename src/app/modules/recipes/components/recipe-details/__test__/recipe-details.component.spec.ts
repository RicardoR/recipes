import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, BehaviorSubject } from 'rxjs';

import { RecipeService } from '../../../services/recipe/recipe.service';
import { RecipeDetailsComponent } from '../recipe-details.component';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { recipeMock } from 'src/app/__tests__/mocks/recipe-mock';
import { userMock } from 'src/app/__tests__/mocks/user-mock';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { Recipe } from '../../../models/recipes.model';

describe('RecipeDetailsComponent', () => {
  let component: RecipeDetailsComponent;
  let fixture: ComponentFixture<RecipeDetailsComponent>;

  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'deleteRecipe',
    'deleteImage',
  ]);

  const recipeStub = new BehaviorSubject<any>({ recipe: recipeMock });
  const activatedRouteStub = { data: recipeStub };
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
  const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
  const firebaseAnalycitsSpy = jasmine.createSpyObj('AngularFireAnalytics', ['logEvent']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecipeDetailsComponent],
      providers: [
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: AngularFireAnalytics, useValue: firebaseAnalycitsSpy }
      ]
    }).overrideTemplate(
      RecipeDetailsComponent,
      '<div class="mt-1" *ngIf="recipeDetails$ | async as recipeDetails"></div>'
    );
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeDetailsComponent);
    component = fixture.componentInstance;
    authServiceSpy.currentUser = userMock;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getRecipeDetails should get the recipe details and determine if is the owner', () => {
    component.recipeDetails$.subscribe((recipe) => expect(recipe).toEqual(recipeMock));
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
      expect(firebaseAnalycitsSpy.logEvent).toHaveBeenCalledWith('delete_recipe_button_clicked');
    });

    it('should not delete the recipe when user cancel the dialog', () => {
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) });

      component.deleteRecipe();
      expect(matDialogSpy.open).toHaveBeenCalled();

      expect(recipeServiceSpy.deleteRecipe).not.toHaveBeenCalled();
      expect(recipeServiceSpy.deleteImage).not.toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      expect(firebaseAnalycitsSpy.logEvent).toHaveBeenCalledWith(
        'delete_recipe_button_clicked'
      );
    });
  });

  describe('editRecipe', () => {
    it('should navigate to edit recipe page when recipe has an id', () => {
      component.editRecipe();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/edit', recipeMock.id]);
      expect(firebaseAnalycitsSpy.logEvent).toHaveBeenCalledWith(
        'edit_recipe_button_clicked'
      );
    });

    it('should no navigate to edit page if recipe id is not present', () => {
      routerSpy.navigate.calls.reset();
      const recipeFake = {} as Recipe;
      recipeStub.next({ recipe: recipeFake });

      component.editRecipe();
      expect(routerSpy.navigate).not.toHaveBeenCalledWith([
        'recipes/edit',
        recipeMock.id
      ]);
      recipeStub.next({ recipe: recipeMock });

    });
  });

  it('should log recipe_detail_component_opened event at start', () => {
    expect(firebaseAnalycitsSpy.logEvent).toHaveBeenCalledWith(
      'recipe_detail_component_opened'
    );
  });
});
