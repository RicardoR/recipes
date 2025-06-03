import { Component, OnInit } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
  UntypedFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

import { AuthData } from '../../auth-data.model';
import { AuthService, FAKE_USER_EMAIL } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [
        MatCardModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        NgIf,
        MatButtonModule,
    ]
})
export class LoginComponent implements OnInit {
  form!: UntypedFormGroup;
  passWordHidden = true;

  constructor(
    private authService: AuthService,
    private fb: UntypedFormBuilder
  ) {}

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
      email: new UntypedFormControl(FAKE_USER_EMAIL, [
        Validators.required,
        Validators.email,
      ]),
      password: new UntypedFormControl('123456', [Validators.required]),
    });
  }
}
