import { AuthService } from './../../auth.service';
import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthData } from '../../auth-data.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  hide = true;

  constructor(private authService: AuthService) {}

  getErrorMessage(): string {
    if (this.form.controls.email.hasError('required')) {
      return 'You must enter a value';
    }

    return this.form.controls.email.hasError('email') ? 'Not a valid email' : '';
  }

  login(): void {

    if (this.form.valid) {
      const user: AuthData = {
        email: this.form.controls.email.value,
        password: this.form.controls.password.value,
      };

      this.authService.login(user);
    }
  }
}
