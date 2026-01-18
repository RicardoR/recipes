import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeLayoutComponent } from '../recipe-layout.component';
import {AuthService} from "../../../../auth/services/auth.service";
import {ActivatedRoute} from "@angular/router";

describe('RecipeLayoutComponent', () => {
  let component: RecipeLayoutComponent;
  let fixture: ComponentFixture<RecipeLayoutComponent>;
  const authServiceSpy = jasmine.createSpyObj('AuthService', [
    'currentUser',
    'logout',
  ]);
  const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeLayoutComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipeLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the toolbar', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('[data-test="toolbar"]')).toBeTruthy();
  })
});
