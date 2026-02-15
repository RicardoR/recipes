import {TestBed} from '@angular/core/testing';
import {vi} from 'vitest';
import {BehaviorSubject} from 'rxjs';

import {AuthReadyGuard} from './auth-ready.guard';
import {AuthService} from 'src/app/core/auth/services/auth.service';

describe('AuthReadyGuard', () => {
  let service: AuthReadyGuard;
  const authServiceSpy = {
    authServiceReady: vi.fn().mockName("AuthService.authServiceReady")
  };

  beforeEach((() => {
    TestBed.configureTestingModule({
      providers: [{provide: AuthService, useValue: authServiceSpy}],
    });
    service = TestBed.inject(AuthReadyGuard);
  }));

  it('should determine if canActivate based on authServiceReady', () => {
    authServiceSpy.authServiceReady.mockReturnValue(new BehaviorSubject(true));
    service.canActivate().subscribe((result) => {
      expect(result).toBe(true);
    });
  });

  it('should determine if canLoad based on authServiceReady', () => {
    authServiceSpy.authServiceReady.mockReturnValue(new BehaviorSubject(false));
    service.canLoad().subscribe((result) => {
      expect(result).toBe(false);
    });
  });
});
