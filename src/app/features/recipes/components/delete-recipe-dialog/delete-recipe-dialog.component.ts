import {Component, inject, OnInit} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { AnalyticsService } from '../../../shared/services/Analytics/analytics.service';

@Component({
    selector: 'app-delete-recipe-dialog',
    templateUrl: './delete-recipe-dialog.component.html',
    styleUrls: ['./delete-recipe-dialog.component.scss'],
    imports: [MatDialogModule, MatButtonModule]
})
export class DeleteRecipeDialogComponent implements OnInit {
  private analytics = inject(AnalyticsService);

  ngOnInit(): void {
    this.analytics.sendToAnalytics('delete_recipe_dialog_opened');
  }
}
