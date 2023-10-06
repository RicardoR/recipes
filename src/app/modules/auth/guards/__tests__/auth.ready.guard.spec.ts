import { TestBed, waitForAsync } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { AuthReadyGuard } from '../auth-ready.guard';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

describe('AuthReadyGuard', () => {
  let service: AuthReadyGuard;
  const authServiceSpy = jasmine.createSpyObj('AuthService', [
    'authServiceReady',
  ]);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
    service = TestBed.inject(AuthReadyGuard);
  }));

  it('should determine if canActivate based on authServiceReady', () => {
    authServiceSpy.authServiceReady.and.returnValue(new BehaviorSubject(true));
    service.canActivate().subscribe((result) => {
      expect(result).toBe(true);
    });
  });

  it('should determine if canLoad based on authServiceReady', () => {
    authServiceSpy.authServiceReady.and.returnValue(new BehaviorSubject(false));
    service.canLoad().subscribe((result) => {
      expect(result).toBe(false);
    });
  });
});
