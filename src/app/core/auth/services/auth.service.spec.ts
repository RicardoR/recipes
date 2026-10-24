import {vi} from "vitest";
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {AuthService} from './auth.service';
import {FIREBASE_AUTH} from 'src/app/core/firebase/firebase.providers';
import {userMock} from '../../../testing-resources/mocks/user-mock';

const {mockSignIn, mockSignOut, mockOnAuthStateChanged} = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockSignOut: vi.fn(),
  mockOnAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignIn,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
}));

describe('AuthService', () => {
  let service: AuthService;

  const routerSpy = {
    navigate: vi.fn().mockName("Router.navigate")
  };
  const mockAuth = {};

  beforeEach(() => {
    vi.clearAllMocks();

    mockSignIn.mockResolvedValue({});
    mockSignOut.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        {provide: FIREBASE_AUTH, useValue: mockAuth},
        {provide: Router, useValue: routerSpy},
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should allow to login and navigate to my recipes component', async () => {
    const autData = {email: 'email@domain.com', password: 'password'};
    service.login(autData);
    expect(mockSignIn).toHaveBeenCalledWith(mockAuth, autData.email, autData.password);
    await Promise.resolve();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['recipes/my-recipes']);
  });

  it('should allow to logout', async () => {
    service.currentUser = userMock;
    service.logout();
    await Promise.resolve();
    expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
    expect(service.currentUser).toBeUndefined();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/recipes']);
  });

  it('should allow to get current user', () => {
    service.currentUser = userMock;
    expect(service.currentUser).toEqual(userMock);
  });

  it('authServiceReady should call initAuthListenerSpy when service is ready', () => {
    const initAuthListenerSpy = vi.spyOn(service, 'initAuthListener');
    initAuthListenerSpy.mockReturnValue(of(true));
    service.authServiceReady().subscribe();
    expect(initAuthListenerSpy).toHaveBeenCalled();
  });

  it('initAuthListener should return true if user exists', () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      (callback as (user: typeof userMock) => void)(userMock);
      return vi.fn();
    });
    service.initAuthListener().subscribe((isuser) => {
      expect(isuser).toBeTruthy();
    });
    expect(mockOnAuthStateChanged).toHaveBeenCalledWith(mockAuth, expect.any(Function));
  });

  it('initAuthListener should return false if user not exists', () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      (callback as (user: null) => void)(null);
      return vi.fn();
    });
    service.initAuthListener().subscribe((isuser) => {
      expect(isuser).toBeFalsy();
    });
  });

  it('isDemoUser should return true with user has the demo email', () => {
    service.currentUser = {...userMock, email: 'test@mail.com'};
    expect(service.isDemoUser).toBeTruthy();
  });

  it('isDemoUser should return false if is not a demo user', () => {
    service.currentUser = userMock;
    expect(service.isDemoUser).toBeFalsy();
  });
});
