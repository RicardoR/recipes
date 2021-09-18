import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeCardFormComponent } from './recipe-card-form.component';

describe('RecipeCardFormComponent', () => {
  let component: RecipeCardFormComponent;
  let fixture: ComponentFixture<RecipeCardFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecipeCardFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeCardFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
