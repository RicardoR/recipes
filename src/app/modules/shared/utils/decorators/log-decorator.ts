import { environment } from 'src/environments/environment';

export function NgLog(): ClassDecorator {
  return function (constructor: any) {
    if (environment.debugMode) {
      const LIFECYCLE_HOOKS = ['ngOnInit', 'ngOnChanges', 'ngOnDestroy'];
      const component = constructor.name;

      LIFECYCLE_HOOKS.forEach((hook) => {
        const original = constructor.prototype[hook];

        constructor.prototype[hook] = function (...args: any) {
          console.log(
            `%c ${component} - ${hook}`,
            `color: #4CAF50; font-weight: bold`,
            ...args
          );
          original && original.apply(this, args);
        };
      });
    }
  };
}
