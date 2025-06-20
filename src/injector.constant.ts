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

export const INJECTOR_ERRORS = {
  EMPTY_PROVIDERS: (
    name?: string,
  ): string => `Injector created without any providers.Consider adding providers
     to enable dependency resolution. ${name && `Injector: ${name}`}`,
  PROVIDER_NOT_FOUND: (token: ProviderToken, name?: string): string =>
    `Injector Error: No provider for ${getTokenName(token)}. ${name && `Injector: ${name}`}`,
  DECORATOR_MISSING: (constructorName: string): string =>
    `Cannot instantiate class ${constructorName} because it does not have a @Injectable decorator.`,
};
