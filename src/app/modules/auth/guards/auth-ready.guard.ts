import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthReadyGuard {
  private authService = inject(AuthService);

  canActivate(): Observable<boolean> {
    return this.authService.authServiceReady();
  }

  canLoad(): Observable<boolean> {
    return this.authService.authServiceReady();
  }
}
