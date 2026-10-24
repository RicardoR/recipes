import {inject, Injectable, Injector} from '@angular/core';
import {Analytics, isSupported, logEvent} from 'firebase/analytics';
import {FIREBASE_ANALYTICS} from 'src/app/core/firebase/firebase.providers';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private injector = inject(Injector);

  private analytics!: Analytics;

  constructor() {
    isSupported().then((isSupported: boolean) => {
      if (isSupported) {
        // Deferred injection (H4): the FIREBASE_ANALYTICS factory (getAnalytics) must not run when
        // analytics is not supported (e.g. jsdom), so it is resolved here instead of via `inject()`.
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
