import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthData } from '../auth-data.model';
import { AppRoutingNames } from 'src/app/app-routing.module';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _currentUser!: AuthData;

  constructor(private auth: AngularFireAuth, private router: Router) {}

  get currentUser(): AuthData {
    return this._currentUser;
  }

  set currentUser(user: AuthData) {
    this._currentUser = user;
  }

  login(authData: AuthData): void {
    this.auth
      .signInWithEmailAndPassword(authData.email, authData.password)
      .then(() => this.router.navigate([AppRoutingNames.recipes]));
  }

  initAuthListener(): Observable<boolean> {
    const userLogged = new Subject<boolean>();
    this.auth.authState
      .pipe(map((user) => {
          if (user) {
            const userData: AuthData = {
              email: user.email ?? '',
              password: '',
              uid: user.uid,
            };

            this.currentUser = userData;
            userLogged.next(true);
          } else {
            this.router.navigate([AppRoutingNames.login]);
            userLogged.next(false);
          }
      }))
      .subscribe();
    return userLogged;
  }
}
