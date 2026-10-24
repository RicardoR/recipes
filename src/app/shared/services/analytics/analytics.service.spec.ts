import {TestBed} from '@angular/core/testing';

import {AnalyticsService} from './analytics.service';
import {firebaseProviders} from 'src/app/core/firebase/firebase.providers';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        firebaseProviders
      ]
    });
    service = TestBed.inject(AnalyticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
