import {Injectable, Injector} from '@angular/core';
import {Analytics, isSupported, logEvent} from '@angular/fire/analytics';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private analytics!: Analytics;

  constructor(private injector: Injector) {
    isSupported().then((isSupported: any) => {
      if (isSupported) {
        this.analytics = this.injector.get(Analytics);
      }
    });
  }


  sendToAnalytics(value: string, params?: { [key: string]: any }): void {
    if (this.analytics) {
      logEvent(this.analytics, value, params);
    } else {
      console.warn('Analytics not initialized, event not sent:', value);
    }
  }
}
