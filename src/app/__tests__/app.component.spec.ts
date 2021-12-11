import { TestBed } from '@angular/core/testing';
import { FirebaseApp } from '@angular/fire';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from '../app.component';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [AngularFireAnalytics, FirebaseApp],
      declarations: [AppComponent],
    }).overrideTemplate(AppComponent, '');
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
