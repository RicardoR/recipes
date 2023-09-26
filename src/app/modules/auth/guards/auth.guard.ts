import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {
  constructor(private authService: AuthService) {}

  canActivate(): Observable<boolean> {
    return this.authService.initAuthListener();
  }

  canLoad(): Observable<boolean> {
    return this.authService.initAuthListener();
  }
}
