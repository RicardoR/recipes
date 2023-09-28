import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeRibbonComponent } from '../recipe-ribbon.component';

describe('RecipeRibbonComponent', () => {
  let component: RecipeRibbonComponent;
  let fixture: ComponentFixture<RecipeRibbonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [RecipeRibbonComponent]
})
      .overrideTemplate(RecipeRibbonComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeRibbonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
