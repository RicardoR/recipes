import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import {Component, inject} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { getAnalytics, logEvent } from '@angular/fire/analytics';
import {AnalyticsService} from "./modules/shared/services/Analytics/analytics.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet],
})
export class AppComponent {
  private analytics = inject(AnalyticsService);

  constructor() {
    registerLocaleData(localeEs);
    this.analytics.sendToAnalytics('app_started');
  }
}
