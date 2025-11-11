import { TestBed } from '@angular/core/testing';

import { ToolbarService } from '../toolbar.service';

fdescribe('ToolbarService', () => {
  let service: ToolbarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolbarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have a signal for store the search term', () => {
    expect(service.searchTerm).toBeDefined();
  });

  it('should update the searchTerm when onSearch is called', () => {
    service.onSearch('test');
    expect(service.searchTerm()).toBe('test');
  });
});
