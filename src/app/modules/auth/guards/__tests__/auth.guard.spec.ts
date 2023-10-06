import { TestBed, waitForAsync } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { AuthGuard } from '../auth.guard';

describe('AuthGuard', () => {
  let service: AuthGuard;
  const authServiceSpy = jasmine.createSpyObj('AuthService', [
    'initAuthListener',
  ]);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
    service = TestBed.inject(AuthGuard);
  }));

  it('should determine if canActivate based on initAuthListener', () => {
    authServiceSpy.initAuthListener.and.returnValue(new BehaviorSubject(true));
    service.canActivate().subscribe((result) => {
      expect(result).toBe(true);
    });
  });

  it('should determine if canLoad based on initAuthListener', () => {
    authServiceSpy.initAuthListener.and.returnValue(new BehaviorSubject(false));
    service.canLoad().subscribe((result) => {
      expect(result).toBe(false);
    });
  });
});
