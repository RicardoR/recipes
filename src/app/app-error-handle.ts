import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { MessagesService } from './modules/shared/services/messages/messages.service';

@Injectable({
  providedIn: 'root'
})
export class AppErrorHandler implements ErrorHandler {
  constructor(
    private messagesService: MessagesService,
    private zone: NgZone
  ) {}

  handleError(error: Error) {
    this.zone.run(() =>
      this.messagesService.showSnackBar(
        error.message || 'Undefined client error'
      )
    );

    console.error(error);
  }
}
