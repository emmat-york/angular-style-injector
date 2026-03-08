import { InjectableConstructor } from './injector.interface';
import { INJECTABLE_MARK } from './injector.util';

/**
 * @description Decorator that marks a class as available to be provided and injected as a dependency.
 * Marking a class with @Injectable ensures that the compiler will generate
 * the necessary metadata to create the class's dependencies when the class is injected.
 **/
export function Injectable() {
  return <T extends InjectableConstructor>(constructor: T): T => {
    constructor[INJECTABLE_MARK] = true;
    return constructor;
  };
}
