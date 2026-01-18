import { Injectable, Injector, inject } from '@angular/core';
import {Analytics, isSupported, logEvent} from '@angular/fire/analytics';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private injector = inject(Injector);

  private analytics!: Analytics;

  constructor() {
    isSupported().then((isSupported: boolean) => {
      if (isSupported) {
        this.analytics = this.injector.get(Analytics);
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
