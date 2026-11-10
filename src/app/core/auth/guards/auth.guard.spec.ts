import {TestBed} from '@angular/core/testing';
import {vi} from 'vitest';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, RouterModule, UrlTree} from '@angular/router';
import {BehaviorSubject} from 'rxjs';

import {AuthService} from 'src/app/core/auth/services/auth.service';
import {AuthGuard} from './auth.guard';

describe('AuthGuard', () => {
  let service: AuthGuard;
  let router: Router;
  const authServiceSpy = {
    initAuthListener: vi.fn().mockName("AuthService.initAuthListener")
  };

  const route = {} as ActivatedRouteSnapshot;
  const stateOf = (url: string) => ({url} as RouterStateSnapshot);

  beforeEach((() => {
    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      providers: [{provide: AuthService, useValue: authServiceSpy}],
    });
    service = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  }));

  it('should determine if canActivate based on initAuthListener', () => {
    authServiceSpy.initAuthListener.mockReturnValue(new BehaviorSubject(true));
    service.canActivate(route, stateOf('/recipes/my-recipes')).subscribe((result) => {
      expect(result).toBe(true);
    });
  });

  // issue #91: without a session the guard must not cancel the navigation (blank screen) but
  // return a UrlTree so the router redirects to /login keeping the requested route.
  it('should redirect to /login with the requested route as returnUrl without session', () => {
    authServiceSpy.initAuthListener.mockReturnValue(new BehaviorSubject(false));
    service.canActivate(route, stateOf('/recipes/my-recipes')).subscribe((result) => {
      expect(result).toBeInstanceOf(UrlTree);
      expect(router.serializeUrl(result as UrlTree)).toBe(
        '/login?returnUrl=%2Frecipes%2Fmy-recipes'
      );
    });
  });

  it('should determine if canLoad based on initAuthListener', () => {
    authServiceSpy.initAuthListener.mockReturnValue(new BehaviorSubject(false));
    service.canLoad().subscribe((result) => {
      expect(result).toBe(false);
    });
  });
});
