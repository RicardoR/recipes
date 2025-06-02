import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteRecipeDialogComponent } from '../delete-recipe-dialog.component';
import {AnalyticsService} from "../../../../shared/services/Analytics/analytics.service";

describe('DeleteRecipeDialogComponent', () => {
  let component: DeleteRecipeDialogComponent;
  let fixture: ComponentFixture<DeleteRecipeDialogComponent>;
  const analyticsSpy = jasmine.createSpyObj('AnalyticsService', ['sendToAnalytics']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DeleteRecipeDialogComponent],
      providers: [
        { provide: AnalyticsService, useValue: analyticsSpy }
      ],
    }).overrideTemplate(DeleteRecipeDialogComponent, '');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteRecipeDialogComponent);

    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should log delete_recipe_dialog_opened event in analytics', () => {
    expect(analyticsSpy.sendToAnalytics).toHaveBeenCalledWith(
      'delete_recipe_dialog_opened'
    );
  });
});
