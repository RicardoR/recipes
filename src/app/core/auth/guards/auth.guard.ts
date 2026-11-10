import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from '@angular/router';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {AuthService} from '../services/auth.service';
import {AppRoutingNames} from 'src/app/app.routes';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.authService.initAuthListener().pipe(
      map((isLogged) => (isLogged ? true : this.loginUrlTree(state.url))),
    );
  }

  canLoad(): Observable<boolean> {
    return this.authService.initAuthListener();
  }

  /**
   * Without a session the navigation must not be merely cancelled (that leaves a blank screen,
   * issue #91): the guard returns a `UrlTree` so the router redirects in the same navigation,
   * keeping the requested route in `returnUrl` to come back after signing in.
   */
  private loginUrlTree(returnUrl: string): UrlTree {
    return this.router.createUrlTree([`/${AppRoutingNames.login}`], {
      queryParams: {returnUrl},
    });
  }
}
