import {Component, OnInit, inject} from '@angular/core';
import {
  Validators,
  FormBuilder,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
} from '@angular/forms';

import {AuthData} from '../../auth-data.model';
import {AuthService, FAKE_USER_EMAIL} from '../../services/auth.service';
import {MatButtonModule} from '@angular/material/button';

import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatCardModule} from '@angular/material/card';

interface LoginFormGroup {
  email: FormControl<string>;
  password: FormControl<string>;
}

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
    MatButtonModule
  ]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  form!: FormGroup<LoginFormGroup>;
  passWordHidden = true;

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
    }) as FormGroup<LoginFormGroup>;
  }
}
