import {Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToolbarService {
  private _searchTerm = signal<string>('');

  get searchTerm() {
    return this._searchTerm.asReadonly();
  }
}
