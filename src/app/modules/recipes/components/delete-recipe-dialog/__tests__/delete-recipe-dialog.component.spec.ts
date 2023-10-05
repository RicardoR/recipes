import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';

import { DeleteRecipeDialogComponent } from '../delete-recipe-dialog.component';
import { AngularFireTestingModule } from 'src/app/testing-resources/modules/angular-fire-testing.module';

describe('DeleteRecipeDialogComponent', () => {
  let component: DeleteRecipeDialogComponent;
  let fixture: ComponentFixture<DeleteRecipeDialogComponent>;
  let angularFireAnalyticsSpy: jasmine.SpyObj<any>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DeleteRecipeDialogComponent, AngularFireTestingModule],
      providers: [],
    }).overrideTemplate(DeleteRecipeDialogComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteRecipeDialogComponent);

    component = fixture.componentInstance;
    angularFireAnalyticsSpy = AngularFireTestingModule.getAngularFireAnalyticsSpy();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should log delete_recipe_dialog_opened event in analytics', fakeAsync(() => {
    expect(angularFireAnalyticsSpy).toHaveBeenCalledWith(
      'delete_recipe_dialog_opened',
    );
  }));
});
