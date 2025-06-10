import { Constructor, InjectableConstructor } from './injector.interface';
import { getID } from './injector.util';

/**
 * @description Decorator that marks a class as available to be provided and injected as a dependency.
 * Marking a class with @Injectable ensures that the compiler will generate
 * the necessary metadata to create the class's dependencies when the class is injected.
 **/
export function Injectable(): (constructor: Constructor) => InjectableConstructor {
  return (constructor: Constructor): InjectableConstructor => {
    class InjectableClass extends constructor {
      static readonly uniqueServiceId = getID();
      static readonly injectable = true;

      constructor(...args: any[]) {
        super(...args);
      }
    }

    return InjectableClass;
  };
}
