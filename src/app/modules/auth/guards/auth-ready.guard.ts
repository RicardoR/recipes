import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanLoad,
} from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthReadyGuard implements CanActivate, CanLoad {
  constructor(private authService: AuthService) {}

  canActivate(): Observable<boolean> {
    return this.authService.authServiceReady();
  }

  canLoad(): Observable<boolean> {
    return this.authService.authServiceReady();
  }
}
