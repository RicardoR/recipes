import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';

import { AuthData } from '../../auth-data.model';
import { AuthService, FAKE_USER_EMAIL } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  passWordHidden = true;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.buildLoginForm();
  }

  getErrorMessage(): string {
    if (this.form.controls.email.hasError('required')) {
      return 'You must enter a value';
    }

    return this.form.controls.email.hasError('email')
      ? 'Not a valid email'
      : '';
  }

  login(): void {
    if (!this.form.valid) {
      return;
    }

    if (this.form.valid) {
      const user: AuthData = {
        email: this.form.controls.email.value,
        password: this.form.controls.password.value,
      };

      this.authService.login(user);
    }
  }

  private buildLoginForm(): void {
    this.form = this.fb.group({
      email: new FormControl(FAKE_USER_EMAIL, [
        Validators.required,
        Validators.email,
      ]),
      password: new FormControl('123456', [Validators.required]),
    });
  }
}
