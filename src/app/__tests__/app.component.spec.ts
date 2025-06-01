import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from '../app.component';
import {AnalyticsService} from "../modules/shared/services/Analytics/analytics.service";
import {RouterModule} from "@angular/router";

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  const analyticsSpy = jasmine.createSpyObj('AnalyticsService', ['sendToAnalytics']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([]), AppComponent],
      providers: [
        { provide: AnalyticsService, useValue: analyticsSpy },
      ],
    }).overrideTemplate(AppComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should log app_started event in analytics', () => {
    expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith('app_started');
  });
});
