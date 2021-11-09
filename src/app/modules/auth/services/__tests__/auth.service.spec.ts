import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../auth.service';
import { userMock } from './../../../../__tests__/mocks/user-mock';

describe('AuthService', () => {
  let service: AuthService;
  let angularFireAuthSpy: jasmine.SpyObj<AngularFireAuth>;

  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

  beforeEach(() => {
    const angularFireAuthSpyValue = jasmine.createSpyObj('AngularFireAuth', [
      'signInWithEmailAndPassword',
      'signOut',
      'authState',
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: AngularFireAuth, useValue: angularFireAuthSpyValue },
        { provide: Router, useValue: routerSpy },
      ],
    });

    angularFireAuthSpy = TestBed.inject(
      AngularFireAuth
    ) as jasmine.SpyObj<AngularFireAuth>;

    angularFireAuthSpy.signInWithEmailAndPassword.and.returnValue(
      Promise.resolve({
        user: {} as any,
        credential: {} as any,
      })
    );
    angularFireAuthSpy.signOut.and.returnValue(Promise.resolve());

    service = TestBed.inject(AuthService);
  });

  it('should allow to login and navigate to my recipes component', fakeAsync(() => {
    const autData = { email: 'email@domain.com', password: 'password' };
    service.login(autData);
    expect(angularFireAuthSpy.signInWithEmailAndPassword).toHaveBeenCalledWith(autData.email, autData.password);
    flushMicrotasks();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/my-recipes']);
  }));

  it('should allow to logout', fakeAsync(() => {
    service.currentUser = userMock;
    const needsReload = false;
    service.logout(needsReload);
    flushMicrotasks();
    expect(angularFireAuthSpy.signOut).toHaveBeenCalled();
    expect(service.currentUser).toBeUndefined();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes']);
  }));

  it('should allow to get current user', () => {
    service.currentUser = userMock;
    expect(service.currentUser).toEqual(userMock);
  });

  it('authServiceReady should call initAuthListenerSpy when service is ready', () => {
    const initAuthListenerSpy = spyOn(service, 'initAuthListener');
    initAuthListenerSpy.and.returnValue(of(true));
    service.authServiceReady().subscribe();
    expect(initAuthListenerSpy).toHaveBeenCalled();
  });

  xit('initAuthListener', () => {
    // todo reactivate ut when resolve this issue:
    // this.auth.authState.pipe is not a function ???
    //angularFireAuthSpy.authState.and.returnValue(of(userMock));

    service.initAuthListener().subscribe((isuser) => {
      expect(isuser).toBeTruthy();
    });
    expect(angularFireAuthSpy.authState).toHaveBeenCalled();
  });
});
