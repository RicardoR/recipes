import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire/compat';
import {
  AngularFireAnalytics,
  AngularFireAnalyticsModule,
} from '@angular/fire/compat/analytics';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { environment } from 'src/environments/environment';

const mockedPromise: Promise<void> = new Promise(() => {});

@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAnalyticsModule,
  ],
})
export class AngularFireTestingModule {
  static getAngularFireAnalyticsSpy(): jasmine.SpyObj<any> {
    return spyOn(AngularFireAnalytics.prototype, 'logEvent').and.returnValue(
      mockedPromise
    );
  }
}
