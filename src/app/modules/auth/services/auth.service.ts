import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';

import { AuthData } from '../auth-data.model';
import { MessagesService } from '../../shared/services/messages/messages.service';
import { AppRoutingNames } from 'src/app/app-routing.module';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _currentUser?: AuthData;

  constructor(
    private auth: AngularFireAuth,
    private messagesService: MessagesService,
    private router: Router
  ) {}

  get currentUser(): AuthData | undefined {
    return this._currentUser;
  }

  set currentUser(user: AuthData | undefined) {
    this._currentUser = user;
  }

  login(authData: AuthData): void {
    this.auth
      .signInWithEmailAndPassword(authData.email, authData.password)
      .then()
      .catch((err) => this.messagesService.showSnackBar(err.message));
  }

  initAuthListener(): void {
    this.auth.authState.subscribe((user) => {
      if (user) {
        const userData: AuthData = {
          email: user.email ? user.email : '',
          password: '',
          uid: user.uid,
        };

        this.currentUser = userData;
        this.router.navigate([AppRoutingNames.recipes]);
      } else {
        this.router.navigate([AppRoutingNames.login]);
      }
    });
  }
}
