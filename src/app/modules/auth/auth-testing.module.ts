import {  NgModule } from "@angular/core";
import { AuthService } from "./services/auth.service";

const authServiceSpy = jasmine.createSpyObj('AuthService', [
  'login',
  'initAuthListener',
  'authServiceReady',
]);

@NgModule({
  imports: [],
  providers: [{ provide: AuthService, useValue: authServiceSpy }],
})
export class AuthTestingModule {}
