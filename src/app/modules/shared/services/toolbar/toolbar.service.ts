import {Injectable, Signal, signal} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToolbarService {
  private _searchTerm = signal<string>('');

  get searchTerm(): Signal<string> {
    return this._searchTerm.asReadonly();
  }

  onSearch(searchData: string): void {
    this._searchTerm.set(searchData);
  }
}
