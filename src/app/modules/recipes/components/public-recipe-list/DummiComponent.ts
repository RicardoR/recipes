import { Component, OnDestroy } from "@angular/core";

@Component({
  template: '<h1>Soy la dummi Class</h1>',
})
export class DummiClassComponent implements OnDestroy {
  constructor() {
    console.log('DummiClass.constructor');
  }

  logSomething(): void {
    console.log('DummiClass.logSomething');
  }

  ngOnDestroy(): void {
    console.log('DummiClass.ngOnDestroy');
  }
}
