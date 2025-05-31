/**
 * @description Decorator that marks a class as available to be provided and injected as a dependency.
 * Marking a class with @Service ensures that the compiler will generate
 * the necessary metadata to create the class's dependencies when the class is injected.
 **/
export function Service(): ClassDecorator {
  return (target: any) => {
    target.injectable = true;
  };
}
