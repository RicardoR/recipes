import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { recipesListMocked, userMocked } from './recipes-list-mocked';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { RecipeService } from '../../../services/recipe/recipe.service';
import { MyRecipesComponent } from '../my-recipes.component';

fdescribe('MyRecipesComponent', () => {
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyRecipesComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
      ]
    })
    .overrideTemplate(MyRecipesComponent, '')
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyRecipesComponent);
    component = fixture.componentInstance;

    recipeServiceSpy.getOwnRecipes.and.returnValue(of(recipesListMocked));
    authServiceSpy.currentUser = userMocked;
    fixture.detectChanges();
  });

  describe('ngOnInit', () => {
    it('should get recipes', () => {
      expect(recipeServiceSpy.getOwnRecipes).toHaveBeenCalled();
      expect(component.recipes).toEqual(recipesListMocked);
    });

    it('should get the current userId', () => {
      expect(component.userId).toEqual(userMocked.uid);
    });
  });

  it('goToCreate should navigate to create a new recipe', () => {
    component.goToCreate();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/new']);
  });

  it('goToRecipe should navigate to the desired recipe', () => {
    component.goToRecipe(recipesListMocked[0]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/details', '1']);
  });

  it('deleteRecipe should delete the recipe', () => {
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) });
    recipeServiceSpy.deleteRecipe.and.returnValue(of(true));
    recipeServiceSpy.deleteImage.and.returnValue(of(true));

    component.deleteRecipe(recipesListMocked[0]);
    expect(matDialogSpy.open).toHaveBeenCalled();
    expect(recipeServiceSpy.deleteRecipe).toHaveBeenCalledWith(recipesListMocked[0].id);
    expect(recipeServiceSpy.deleteImage).toHaveBeenCalledWith(recipesListMocked[0].imgSrc);
    expect(recipeServiceSpy.getOwnRecipes).toHaveBeenCalled();
  });
});