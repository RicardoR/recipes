import { enableProdMode, ErrorHandler, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAnalytics, provideAnalytics } from '@angular/fire/analytics';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { provideAnimations } from '@angular/platform-browser/animations';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { getAuth, provideAuth } from "@angular/fire/auth";

import { AppRoutingModule } from './app/app-routing.module';
import { AppErrorHandler } from './app/app-error-handle';


if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideFirestore(() => getFirestore()),
      provideAnalytics(() => getAnalytics()),
      provideAuth(() => getAuth()),
      { provide: FIREBASE_OPTIONS, useValue: environment.firebase },
      importProvidersFrom(
        BrowserModule,
        AppRoutingModule,
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
})
  .catch(err => console.error(err));
