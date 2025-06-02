import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {Observable, ReplaySubject, Subject} from 'rxjs';
import {map, take} from 'rxjs/operators';

import {AuthData} from '../auth-data.model';
import {AppRoutingNames} from 'src/app/app.routes';
import {RecipesRoutingNames} from '../../recipes/recipes.routes';

export const FAKE_USER_EMAIL = 'test@mail.com';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _currentUser?: AuthData;
  logoutSuccess$ = new Subject<void>();

  constructor(private auth: AngularFireAuth, private router: Router) {}

  get currentUser(): AuthData | undefined {
    return this._currentUser;
  }

  set currentUser(user: AuthData | undefined) {
    this._currentUser = user;
  }

  get isDemoUser(): boolean {
    return this._currentUser?.email === FAKE_USER_EMAIL;
  }

  login(authData: AuthData): void {
    this.auth
      .signInWithEmailAndPassword(authData.email, authData.password)
      .then(() =>
        this.router.navigate([
          `${AppRoutingNames.recipes}/${RecipesRoutingNames.myRecipes}`,
        ])
      );
  }

  logout(): void {
    this.auth.signOut().then(() => {
      this._currentUser = undefined;
      this.router.navigate([`/${AppRoutingNames.recipes}`]);
      this.logoutSuccess$.next();
    });
  }

  initAuthListener(): Observable<boolean> {
    const userLogged = new ReplaySubject<boolean>();
    this.auth.authState
      .pipe(
        take(1),
        map((user) => {
          if (user) {
            this.currentUser = {
              email: user.email ?? '',
              password: '',
              uid: user.uid,
            };
            userLogged.next(true);
          } else {
            userLogged.next(false);
          }
        })
      )
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
