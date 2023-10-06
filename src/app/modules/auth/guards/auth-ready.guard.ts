import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthReadyGuard {
  constructor(private authService: AuthService) {}

  canActivate(): Observable<boolean> {
    return this.authService.authServiceReady();
  }

  canLoad(): Observable<boolean> {
    return this.authService.authServiceReady();
  }
}
