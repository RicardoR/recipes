import { TestBed, waitForAsync } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { AuthReadyGuard } from '../auth-ready.guard';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { AuthTestingModule } from '../../auth-testing.module';

describe('AuthReadyGuard', () => {
  let service: AuthReadyGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;


  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [AuthTestingModule],
      });

      authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
      service = TestBed.inject(AuthReadyGuard);
    })
  );

  it('should determine if canActivate based on authServiceReady', () => {
    authServiceSpy.authServiceReady.and.returnValue(new BehaviorSubject(true));
    service.canActivate().subscribe(result => {
      expect(result).toBe(true);
    });
  });

  it('should determine if canLoad based on authServiceReady', () => {
    authServiceSpy.authServiceReady.and.returnValue(new BehaviorSubject(false));
    service.canLoad().subscribe(result => {
      expect(result).toBe(false);
    });
  });

});
