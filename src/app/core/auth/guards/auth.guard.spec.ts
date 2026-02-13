import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';

import { AuthService } from 'src/app/core/auth/services/auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
    let service: AuthGuard;
    const authServiceSpy = {
        initAuthListener: vi.fn().mockName("AuthService.initAuthListener")
    };

    beforeEach((() => {
        TestBed.configureTestingModule({
            providers: [{ provide: AuthService, useValue: authServiceSpy }],
        });
        service = TestBed.inject(AuthGuard);
    }));

    it('should determine if canActivate based on initAuthListener', () => {
        authServiceSpy.initAuthListener.mockReturnValue(new BehaviorSubject(true));
        service.canActivate().subscribe((result) => {
            expect(result).toBe(true);
        });
    });

    it('should determine if canLoad based on initAuthListener', () => {
        authServiceSpy.initAuthListener.mockReturnValue(new BehaviorSubject(false));
        service.canLoad().subscribe((result) => {
            expect(result).toBe(false);
        });
    });
});
