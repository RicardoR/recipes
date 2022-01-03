import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { MessagesService } from './modules/shared/services/messages/messages.service';

@Injectable({
  providedIn: 'root',
})
export class AppErrorHandler implements ErrorHandler {
  constructor(
    private messagesService: MessagesService,
    private zone: NgZone,
    private analytics: AngularFireAnalytics
  ) {}

  handleError(error: Error) {
    this.zone.run(() =>
      this.messagesService.showSnackBar(
        error.message || 'Undefined client error'
      )
    );

    this.analytics.logEvent(`client_error: ${error.message}`);

    console.error(error);
  }
}
