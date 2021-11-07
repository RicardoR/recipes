import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteRecipeDialogComponent } from '../delete-recipe-dialog.component';

describe('DeleteRecipeDialogComponent', () => {
  let component: DeleteRecipeDialogComponent;
  let fixture: ComponentFixture<DeleteRecipeDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteRecipeDialogComponent ]
    })
    .overrideTemplate(DeleteRecipeDialogComponent, '')
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteRecipeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
