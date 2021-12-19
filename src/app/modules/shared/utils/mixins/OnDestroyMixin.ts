import { OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
type Constructor = new (...args: any[]) => any;

export function OnDestroyMixin<T extends Constructor>(Base: T = class { } as any) {

  return class extends Base implements OnDestroy {
    constructor(...args: any[]) {
      super(...args);
      console.log('OnDestroyMixin.constructor', this);
      this.destroy$ = new Subject();
    }

    public ngOnDestroy(): void {
      console.log('OnDestroyMixin.ngOnDestroy');
      this.destroy$.next(null);
      this.destroy$.complete();
    }
  };
}
