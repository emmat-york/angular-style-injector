import { Constructor } from './injector.interface';

/**
 * @description Decorator that marks a class as available to be provided and injected as a dependency.
 * Marking a class with @Injectable ensures that the compiler will generate
 * the necessary metadata to create the class's dependencies when the class is injected.
 **/
export function Injectable(): Function {
  return (constructor: Constructor) => {
    return class extends constructor {
      static injectable = true;

      constructor(...args: any[]) {
        super(...args);
      }
    };
  };
}
