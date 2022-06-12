import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RecipeService } from 'src/app/modules/recipes/services/recipe/recipe.service';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { MEDIA_STORAGE_PATH, RecipeCardFormComponent } from '../recipe-card-form.component';
import { UtilService } from '../../../utils/utils.service';
import { MessagesService } from '../../../services/messages/messages.service';
import { userMock } from 'src/app/__tests__/mocks/user-mock';
import { recipeMock } from 'src/app/__tests__/mocks/recipe-mock';
import { categoriesMock } from 'src/app/__tests__/mocks/categories-mock';

describe('RecipeCardFormComponent', () => {
  let component: RecipeCardFormComponent;
  let fixture: ComponentFixture<RecipeCardFormComponent>;
  let recipeChangeSpy: jasmine.Spy;
  let seeReceiptSpy: jasmine.Spy;

  const recipeServiceSpy = jasmine.createSpyObj('RecipeService', [
    'uploadFileAndGetMetadata',
    'getCategories'
  ]);
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
  const messagesServiceSpy = jasmine.createSpyObj('MessagesService', [
    'showSnackBar',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecipeCardFormComponent],
      providers: [
        FormBuilder,
        ChangeDetectorRef,
        UtilService,
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MessagesService, useValue: messagesServiceSpy },
      ],
    }).overrideTemplate(RecipeCardFormComponent, '');
  });

  beforeEach(() => {
    authServiceSpy.currentUser = userMock;

    fixture = TestBed.createComponent(RecipeCardFormComponent);
    component = fixture.componentInstance;
    recipeChangeSpy = spyOn(component.recipeChanged$, 'emit');
    seeReceiptSpy = spyOn(component.seeReceipt$, 'next');
    recipeServiceSpy.getCategories.and.returnValue(of(categoriesMock));
    fixture.detectChanges();
  });

  it('should init the empty form at loading and set the user', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('title')?.value).toBe('');
    expect(component.form.get('description')?.value).toBe('');
    expect(component.form.get('ingredients')?.value).toEqual([]);
    expect(component.form.get('steps')?.value).toEqual([]);

    expect(component.pictureForm).toBeTruthy();
    expect(component.pictureForm.get('picture')?.value).toBe(undefined);

    expect(component.user).toEqual(userMock);
  });

  it('should be creation data at first', () => {
    expect(component.edittingMode).toBeFalsy();
    expect(component.isOwnRecipe).toBeFalsy();
    expect(component.recipeImage).toBeUndefined();
  });

  it('should retrieve the categories', () => {
    expect(recipeServiceSpy.getCategories).toHaveBeenCalled();
    expect(component.categories).toEqual(categoriesMock);
  });

  describe('when retrieve data', () => {
    beforeEach(() => {
      component.recipeDetails = recipeMock;
    });

    it('should put in editing mode', () => {
      const isOwnRecipe = recipeMock.ownerId === userMock.uid;

      expect(component.edittingMode).toBeTruthy();
      expect(component.isOwnRecipe).toBe(isOwnRecipe);
      expect(component.recipeImage).toBe(recipeMock.imgSrc);
    });

    it('fill the controls', () => {
      expect(component.form.get('title')?.value).toBe(recipeMock.title);

      const ingredientsInForm = component.form.get('ingredients')?.getRawValue();
      expect(ingredientsInForm).toEqual(recipeMock.ingredients);

      const stepsInForm = component.form.get('steps')?.getRawValue();
      expect(stepsInForm).toEqual(recipeMock.steps);

      expect(component.form.get('description')?.value).toBe(
        recipeMock.description
      );
    });
  });

  describe('sendRecipe', () => {
    beforeEach(() => {
      component.form.reset();
      recipeChangeSpy.calls.reset();
    });

    it('should not emit change if form is not valid', () => {
      expect(component.form.valid).toBeFalsy();
      component.sendRecipe();
      expect(recipeChangeSpy).not.toHaveBeenCalled();
    });

    it('should emit change if form is valid', () => {
      component.form.patchValue({
        title: 'title',
        description: 'description',
        private: true,
      });

      component.addControl(component.steps, new Event('click'));
      component.form.get('steps')?.get('0')?.patchValue({ data: 'step 0' });

      component.addControl(component.ingredients, new Event('click'));
      component.form
        .get('ingredients')
        ?.get('0')
        ?.patchValue({ data: 'ingredient 0' });

      expect(component.form.valid).toBeTruthy();
      component.sendRecipe();
      // todo: to investigate: if I try to haveBeenCalledWith the date fails but the date is the same. Weird
      expect(recipeChangeSpy).toHaveBeenCalled();
    });
  });

  it('createFormItem should return a form group with the desired data', () => {
    const formItem = component.createFormItem('title');
    expect(formItem.value).toEqual( 'title');
  });

  it('addControl should add a new control to the form', () => {
    const event = new Event('click');
    component.addControl(component.steps, event);
    expect(component.form.get('steps')?.value.length).toBe(1);
  });

  it('deleteControl should remove a control from the form', () => {
    const event = new Event('click');
    component.addControl(component.steps, event);
    expect(component.form.get('steps')?.value.length).toBe(1);
    component.deleteControl(component.steps, 0);
    expect(component.form.get('steps')?.value.length).toBe(0);
  });

  it('seeReceipt should emit user want see the current receipt', () => {
    component.seeReceipt();
    expect(seeReceiptSpy).toHaveBeenCalled();
  });

  it('should upload the image and get the metadata', () => {
    const file = new File([], 'test.jpg');
    recipeServiceSpy.uploadFileAndGetMetadata.and.returnValue({
      uploadProgress$: of(100),
      downloadUrl$: of('url'),
    });

    component.pictureForm.get('photo')?.setValue(file);
    component.postImage();
    expect(recipeServiceSpy.uploadFileAndGetMetadata).toHaveBeenCalledWith(
      MEDIA_STORAGE_PATH,
      file
    );
  });

  it('dropElement should allow to reorder the list', () => {
    const event = new Event('click');
    const cdkDragDropEvent = {
      previousIndex: 1,
      currentIndex: 0,
    } as CdkDragDrop<string[]>;

    component.addControl(component.steps, event);
    component.addControl(component.steps, event);

    component.form.get('steps')?.get('0')?.patchValue({ data: 'step 0' });
    component.form.get('steps')?.get('1')?.patchValue({ data: 'step 1' });

    expect(component.form.get('steps')?.get('0')?.value.data).toBe('step 0');
    component.dropElement(cdkDragDropEvent, component.steps.controls);
    expect(component.form.get('steps')?.get('0')?.value.data).toBe('step 1');
  });

  it('isFormSending should update the isSending status', () => {
    expect(component.isSending).toBeFalsy();
    component.isFormSending = true;
    expect(component.isSending).toBeTruthy();
  });
});
