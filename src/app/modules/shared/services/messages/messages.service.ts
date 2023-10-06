import { MatSnackBar } from '@angular/material/snack-bar';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private snackBar = inject(MatSnackBar);

  showSnackBar(message: string, action?: string, duration = 3000): void {
    this.snackBar.open(message, action, { duration });
  }
}
