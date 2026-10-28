import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import {
  InMemoryScrollingOptions,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling
} from '@angular/router';

import {APP_ROUTES} from './app.routes';
import {firebaseProviders} from './core/firebase/firebase.providers';
import {environment} from "../environments/environment";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {ServiceWorkerModule} from "@angular/service-worker";
import {AppErrorHandler} from "./app-error-handle";


const scrollConfig: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'top',
  anchorScrolling: 'enabled',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    firebaseProviders,
    provideRouter(APP_ROUTES, withInMemoryScrolling(scrollConfig), withComponentInputBinding()),
    importProvidersFrom(
      MatSnackBarModule,
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: environment.production,
        registrationStrategy: 'registerWhenStable:30000'
      })),
    {
      provide: ErrorHandler,
      useClass: AppErrorHandler,
    },
    {
      provide: LOCALE_ID,
      useValue: 'es'
    }
  ]
};

