import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { AuthData } from '../auth-data.model';
import { AppRoutingNames } from 'src/app/app-routing.module';
import { RecipesRoutingNames } from '../../recipes/recipes-routing.module';

export const FAKE_USER_EMAIL = 'test@mail.com';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _currentUser?: AuthData;
  private _isDemoUser?: boolean;


  constructor(private auth: AngularFireAuth, private router: Router) {}

  get currentUser(): AuthData | undefined {
    return this._currentUser;
  }

  set currentUser(user: AuthData | undefined) {
    this._currentUser = user;
  }

  get isDemoUser(): boolean {
    return this._isDemoUser ?? false;
  }

  login(authData: AuthData): void {
    this.auth
      .signInWithEmailAndPassword(authData.email, authData.password)
      .then(() =>
        this.router.navigate([
          `${AppRoutingNames.recipes}/${RecipesRoutingNames.myRecipes}`
        ])
      );
  }

  logout(): void {
    this.auth.signOut().then(() => {
      this._currentUser = undefined;
      this.router.navigate([`/${AppRoutingNames.recipes}`]);
    })
  }

  initAuthListener(): Observable<boolean> {
    const userLogged = new Subject<boolean>();
    this.auth.authState
      .pipe(
        take(1),
        map((user) => {
          if (user) {
            const userData: AuthData = {
              email: user.email ?? '',
              password: '',
              uid: user.uid,
            };

            this.currentUser = userData;
            this._isDemoUser = user.email === FAKE_USER_EMAIL;
            userLogged.next(true);
          } else {
            userLogged.next(false);
          }
      }))
      .subscribe();
    return userLogged;
  }

  authServiceReady(): Observable<boolean> {
    const authServiceReady = new Subject<boolean>();

    this.initAuthListener()
      .pipe(take(1))
      .subscribe(() => authServiceReady.next(true));
    return authServiceReady;
  }
}
