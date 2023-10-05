import { Component, OnInit, inject } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
    selector: 'app-delete-recipe-dialog',
    templateUrl: './delete-recipe-dialog.component.html',
    styleUrls: ['./delete-recipe-dialog.component.scss'],
    standalone: true,
    imports: [MatDialogModule, MatButtonModule],
})
export class DeleteRecipeDialogComponent implements OnInit {
  private analytics = inject(AngularFireAnalytics);

  ngOnInit(): void {
    this.analytics.logEvent('delete_recipe_dialog_opened');
  }
}
