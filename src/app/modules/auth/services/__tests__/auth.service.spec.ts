import { fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../auth.service';
import { userMock } from './../../../../__tests__/mocks/user-mock';

describe('AuthService', () => {
  let service: AuthService;
  const angularFireAuthSpy = jasmine.createSpyObj('AngularFireAuth', [
    'signInWithEmailAndPassword',
    'signOut',
    'authState',
  ]);
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AngularFireAuth, useValue: angularFireAuthSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    angularFireAuthSpy.signInWithEmailAndPassword.and.returnValue(
      Promise.resolve(['test'])
    );
    angularFireAuthSpy.signOut.and.returnValue(Promise.resolve(['test']));

    service = TestBed.inject(AuthService);

  }));

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

  it('authServiceReady should return true when service is ready', () => {
    // todo: is this working fine ?
    const initAuthListenerSpy = spyOn(service, 'initAuthListener');
    initAuthListenerSpy.and.returnValue(of(true));
    service.authServiceReady().subscribe((ready) => {
      expect(ready).toBeTruthy();
      expect(initAuthListenerSpy).toHaveBeenCalled();
    });
  });

  xit('initAuthListener', () => {
    // todo reactivate ut when resolve this weird issue:
    // this.auth.authState.pipe is not a function ???

    angularFireAuthSpy.authState.and.returnValue(of(userMock));
    service.initAuthListener().subscribe((isuser) => {
      expect(isuser).toBeTruthy();
    });
    expect(angularFireAuthSpy.authState).toHaveBeenCalled();
  });
});
