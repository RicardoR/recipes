import {ApplicationConfig, ErrorHandler, importProvidersFrom, LOCALE_ID} from '@angular/core';
import {
  InMemoryScrollingOptions,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling
} from '@angular/router';

import {APP_ROUTES} from './app.routes';
import {firebaseProviders} from './core/firebase/firebase.providers';
import {environment} from "../environments/environment";
import {BrowserModule} from "@angular/platform-browser";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {ServiceWorkerModule} from "@angular/service-worker";
import {AppErrorHandler} from "./app-error-handle";
import {provideAnimations} from "@angular/platform-browser/animations";


const scrollConfig: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'top',
  anchorScrolling: 'enabled',
};

export const appConfig: ApplicationConfig = {
  providers: [
    firebaseProviders,
    provideRouter(APP_ROUTES, withInMemoryScrolling(scrollConfig), withComponentInputBinding()),
    importProvidersFrom(
      BrowserModule,
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
    },
    provideAnimations(),
  ]
};


