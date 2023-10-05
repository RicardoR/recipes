import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { userMock } from 'src/app/testing-resources/mocks/user-mock';
import { ToolbarComponent } from '../toolbar.component';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  const authServiceSpy = jasmine.createSpyObj('AuthService', [
    'currentUser',
    'logout'
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToolbarComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).overrideTemplate(ToolbarComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    authServiceSpy.currentUser = userMock;
    fixture.detectChanges();
  });

  it('should get the userId from authService', () => {
    expect(component.userId).toEqual(userMock.uid);
  });

  it('goToCreate should navigate to recipes/new', () => {
    component.goToCreate();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/new']);
  });

  it('goToPrivateList should navigate to the private list', () => {
    component.goToPrivateList();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/my-recipes']);
  });

  it('goToPublicList should navigate to recipes', () => {
    component.goToPublicList();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes']);
  });

  it('logout should call to logout method from authService', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});
