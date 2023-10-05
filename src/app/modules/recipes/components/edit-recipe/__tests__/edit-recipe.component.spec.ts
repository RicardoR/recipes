import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { MessagesService } from 'src/app/modules/shared/services/messages/messages.service';
import { RecipeService } from '../../../services/recipe/recipe.service';
import { EditRecipeComponent } from '../edit-recipe.component';
import { recipeMock } from '../../../../../testing-resources/mocks/recipe-mock';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';

describe('EditRecipeComponent', () => {
  let component: EditRecipeComponent;
  let fixture: ComponentFixture<EditRecipeComponent>;

  const routeSpy = jasmine.createSpyObj('Router', ['navigate']);
  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'updateRecipe',
    'deleteImage',
  ]);
  const messagesServiceSpy = jasmine.createSpyObj('MessagesService', ['showSnackBar']);
  const activatedRouteStub = { data: of({ recipe: recipeMock }) };
  const firebaseAnalycitsSpy = jasmine.createSpyObj('AngularFireAnalytics', ['logEvent']);

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [EditRecipeComponent],
    providers: [
        { provide: Router, useValue: routeSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: MessagesService, useValue: messagesServiceSpy },
        { provide: AngularFireAnalytics, useValue: firebaseAnalycitsSpy },
    ],
})
      .overrideTemplate(EditRecipeComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditRecipeComponent);
    component = fixture.componentInstance;
    recipeServiceSpy.updateRecipe.and.returnValue(of({}));
    recipeServiceSpy.deleteImage.and.returnValue(of({}));

    fixture.detectChanges();
  });

  it('should get the recipe details when loading', () => {
    expect(component.recipeDetails).toEqual(recipeMock);
  });

  it('goToList should allow to navigate to private list', () => {
    component.goToList();
    expect(routeSpy.navigate).toHaveBeenCalledWith(['recipes/my-recipes']);
  });

  it('goToReceipt should allow to navigate to the receipt', () => {
    component.goToRecipe();
    expect(routeSpy.navigate).toHaveBeenCalledWith(['recipes/details', component.recipeDetails.id]);
  });

  it('updateRecipe should allow to update the recipe', () => {
    recipeServiceSpy.updateRecipe.and.returnValue(of({}));
    component.updateRecipe(component.recipeDetails);
    expect(firebaseAnalycitsSpy.logEvent).toHaveBeenCalledWith('update_recipe_button_clicked');
    expect(recipeServiceSpy.updateRecipe).toHaveBeenCalledWith(component.recipeDetails);
    expect(messagesServiceSpy.showSnackBar).toHaveBeenCalledWith(
      'Receta actualizada'
    );
  });

  it('should delete the old image when is changed', () => {
    const newRecipe = { ...recipeMock };
    newRecipe.imgSrc = 'new-image';
    component.updateRecipe(newRecipe);
    expect(recipeServiceSpy.deleteImage).toHaveBeenCalledWith(component.recipeDetails.imgSrc);
  });

  it('should log edit_recipe_component_opened event', () => {
    expect(firebaseAnalycitsSpy.logEvent).toHaveBeenCalledWith('edit_recipe_component_opened');
  });
});
