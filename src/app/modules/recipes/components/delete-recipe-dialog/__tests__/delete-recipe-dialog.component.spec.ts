import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';

import { DeleteRecipeDialogComponent } from '../delete-recipe-dialog.component';

describe('DeleteRecipeDialogComponent', () => {
  let component: DeleteRecipeDialogComponent;
  let fixture: ComponentFixture<DeleteRecipeDialogComponent>;
  const firebaseAnalycitsSpy = jasmine.createSpyObj('AngularFireAnalytics', [
    'logEvent',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteRecipeDialogComponent],
      providers: [
        { provide: AngularFireAnalytics, useValue: firebaseAnalycitsSpy },
      ],
    }).overrideTemplate(DeleteRecipeDialogComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteRecipeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should log delete_recipe_dialog_opened event in analytics', () => {
    expect(firebaseAnalycitsSpy.logEvent).toHaveBeenCalledWith(
      'delete_recipe_dialog_opened',
    );
  });
});
