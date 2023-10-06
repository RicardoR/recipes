import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './components/login/login.component';
import { AuthRoutingModule } from './auth-routing.module';

@NgModule({
  imports: [CommonModule, AuthRoutingModule, LoginComponent],
})
export class AuthModule {}
