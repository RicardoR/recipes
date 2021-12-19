import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from '../app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  const firebaseAnalycitsSpy = jasmine.createSpyObj('AngularFireAnalytics', ['logEvent']);
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AngularFireAnalytics, useValue: firebaseAnalycitsSpy },
      ],
      declarations: [AppComponent],
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
    expect(firebaseAnalycitsSpy.logEvent).toHaveBeenCalledWith('app_started');
  });
});
