import { Component } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';

@Component({
  selector: 'app-delete-recipe-dialog',
  templateUrl: './delete-recipe-dialog.component.html',
  styleUrls: ['./delete-recipe-dialog.component.scss'],
})
export class DeleteRecipeDialogComponent {
  constructor(private analytics: AngularFireAnalytics) {
    this.analytics.logEvent('delete_recipe_dialog_opened');
  }
}
