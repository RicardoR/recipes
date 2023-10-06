import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import { Component } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet],
})
export class AppComponent {
  constructor(private analytics: AngularFireAnalytics) {
    registerLocaleData(localeEs);
    this.analytics.logEvent('app_started');
  }
}
