import { enableProdMode, ErrorHandler, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAnalytics, provideAnalytics } from '@angular/fire/analytics';
import { AuthModule } from './app/modules/auth/auth.module';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireModule } from '@angular/fire/compat';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppErrorHandler } from './app/app-error-handle';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';


if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideFirestore(() => getFirestore()),
      provideAnalytics(() => getAnalytics()),
      importProvidersFrom(
        BrowserModule,
        AppRoutingModule,
        // Firebase
        AngularFireModule.initializeApp(environment.firebase), // todo: can be removed ?
        AuthModule,
        MatSnackBarModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production,
            // Register the ServiceWorker as soon as the app is stable
            // or after 30 seconds (whichever comes first).
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
