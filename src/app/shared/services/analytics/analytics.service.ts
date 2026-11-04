import {inject, Injectable, Injector} from '@angular/core';
import {Analytics, isSupported, logEvent} from 'firebase/analytics';
import {FIREBASE_ANALYTICS} from 'src/app/core/firebase/firebase.providers';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private injector = inject(Injector);

  private analytics!: Analytics;

  constructor() {
    // Emulator runs (e2e and the unit-test build) must never talk to Google: the test
    // environment ships a fake apiKey/measurementId, so every request fails loudly in the
    // console. `sendToAnalytics` degrades to a warning, as it already does when unsupported.
    if (environment.useEmulators) {
      return;
    }

    isSupported().then((isSupported: boolean) => {
      if (isSupported) {
        this.analytics = this.injector.get(FIREBASE_ANALYTICS);
      }
    });
  }


  sendToAnalytics(value: string, params?: Record<string, unknown>): void {
    if (this.analytics) {
      logEvent(this.analytics, value, params);
    } else {
      console.warn('analytics not initialized, event not sent:', value);
    }
  }
}
