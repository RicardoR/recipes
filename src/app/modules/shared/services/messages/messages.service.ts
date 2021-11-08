import { MatSnackBar } from '@angular/material/snack-bar';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  constructor(private snackBar: MatSnackBar) { }

  showSnackBar(message: string, action?: string, duration = 3000): void {
      this.snackBar.open(message, action, { duration });
  }
}
