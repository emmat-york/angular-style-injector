import { getID } from './injector.util';
import { ProviderToken } from './injector.interface';

export class InjectionToken<T> {
  private readonly uniqueDesc: string;
  private readonly id = getID();

  constructor(uniqueDesc: string) {
    this.uniqueDesc = uniqueDesc;
  }

  get description(): string {
    return this.uniqueDesc;
  }

  get identifier(): string {
    return this.id;
  }
}

const getTokenName = (token: ProviderToken): string => {
  return typeof token === 'function' ? token.name : token.description;
};

const getInjectorName = (name?: string): string => {
  return name ? `Injector: ${name}` : '';
};

export const INJECTOR_ERRORS = {
  EMPTY_PROVIDERS: (name?: string): string => {
    return `Injector created without any providers. Consider adding providers to enable dependency resolution. ${getInjectorName(name)}`;
  },
  PROVIDER_NOT_FOUND: (token: ProviderToken, name?: string): string => {
    return `Injector Error: No provider for ${getTokenName(token)}. ${getInjectorName(name)}`;
  },
  DECORATOR_MISSING: (constructorName: string): string => {
    return `Injector Error: Cannot instantiate class ${constructorName} because it does not have the @Injectable decorator.`;
  },
};
