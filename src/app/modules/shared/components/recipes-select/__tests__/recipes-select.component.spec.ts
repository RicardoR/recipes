import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipesSelectComponent } from '../recipes-select.component';

describe('RecipesSelectComponent', () => {
  let component: RecipesSelectComponent;
  let fixture: ComponentFixture<RecipesSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecipesSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipesSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
