import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  private authService = inject(AuthService);

  canActivate(): Observable<boolean> {
    return this.authService.initAuthListener();
  }

  canLoad(): Observable<boolean> {
    return this.authService.initAuthListener();
  }
}
