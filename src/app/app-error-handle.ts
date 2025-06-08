import {ErrorHandler, inject, Injectable, Injector, NgZone} from '@angular/core';
import { MessagesService } from './modules/shared/services/messages/messages.service';
import { AnalyticsService } from './modules/shared/services/Analytics/analytics.service';

@Injectable({
  providedIn: 'root',
})
export class AppErrorHandler implements ErrorHandler {
  private injector = inject(Injector);

  private messagesService: MessagesService = inject(MessagesService);
  private zone: NgZone = inject(NgZone);

  handleError(error: Error) {
    this.zone.run(() =>
      this.messagesService.showSnackBar(
        error.message || 'Undefined client error'
      )
    );
    const analytics = this.injector.get(AnalyticsService, null);
    if (analytics) {
      analytics.sendToAnalytics(`client_error: ${error.message}`);
    }

    console.error(error);
  }
}
