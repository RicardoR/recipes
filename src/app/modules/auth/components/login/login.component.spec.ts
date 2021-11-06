import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const mockedServiceSpy = jasmine.createSpyObj('AuthService', ['login',]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      providers: [{ provide: AuthService, useValue: mockedServiceSpy }],
    })
      .overrideTemplate(LoginComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the login form at beginning', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('email')).toBeTruthy();
    expect(component.form.get('password')).toBeTruthy();
  });

  describe('#login', () => {
    it('should not call the login method of the auth service if the form is not valid', () => {
      component.form.get('email')?.setValue('not-valid-email');
      component.login();
      expect(mockedServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should call the login method of the auth service if the form is valid', () => {
      component.form.get('email')?.setValue('email@domain.com');
      component.form.get('password')?.setValue('valid-password');
      component.login();
      expect(mockedServiceSpy.login).toHaveBeenCalled();
    });
  });

  describe('#getErrorMessage', () => {
    it('should return "Not a valid email" for an invalid email', () => {
      component.form.get('email')?.setValue('not-valid-email');
      expect(component.getErrorMessage()).toEqual('Not a valid email');
    });

    it('should return "You must enter a value" when email is empty', () => {
      component.form.get('email')?.setValue('');
      expect(component.getErrorMessage()).toEqual('You must enter a value');
    });

    it('should return an empty string if the form is valid', () => {
      component.form.get('email')?.setValue('email@domain.com');
      expect(component.getErrorMessage()).toEqual('');
    });
  });
});
