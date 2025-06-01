import {ErrorHandler, Injectable, Injector, NgZone} from '@angular/core';
import { isSupported } from '@angular/fire/analytics';
import { MessagesService } from './modules/shared/services/messages/messages.service';
import { AnalyticsService } from './modules/shared/services/Analytics/analytics.service';

@Injectable({
  providedIn: 'root',
})
export class AppErrorHandler implements ErrorHandler {
  private analytics!: AnalyticsService;

  constructor(
    private messagesService: MessagesService,
    private zone: NgZone,
    private injector: Injector
  ) {
    this.initAnalyticsWhenIsSupported();
  }

  handleError(error: Error) {
    this.zone.run(() =>
      this.messagesService.showSnackBar(
        error.message || 'Undefined client error'
      )
    );

    this.analytics.sendToAnalytics(`client_error: ${error.message}`);

    console.error(error);
  }

  private initAnalyticsWhenIsSupported() {
    isSupported().then((isSupported: any) => {
      if (isSupported) {
        this.analytics = this.injector.get(AnalyticsService);
      }
    });
  }
}
