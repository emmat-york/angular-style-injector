import { ProviderConfig, ProviderToken } from './injector.interface';

export class InjectionToken<T> {
  private readonly uniqueDesc: string;

  constructor(uniqueDesc: string) {
    this.uniqueDesc = uniqueDesc;
  }

  get description(): string {
    return this.uniqueDesc;
  }
}

export const isSingleProvider = (config: ProviderConfig): boolean => {
  return typeof config === 'function' || !('multi' in config) || !config.multi;
};

const getTokenName = (token: ProviderToken): string => {
  return typeof token === 'function' ? token.name : token.description;
};

const getInjectorName = (name?: string): string => {
  return name ? `Injector: ${name}` : '';
};

export const INJECTABLE_MARK = Symbol('CLASS_INJECTABLE_MARK_FOR_DI');

export const INJECTOR_ERRORS = {
  EMPTY_PROVIDERS_WARN: (name?: string): string => {
    return `Injector created without any providers. Consider adding providers to enable dependency resolution. ${getInjectorName(name)}`;
  },
  THROW_PROVIDER_NOT_FOUND: (token: ProviderToken, name?: string): string => {
    return `Injector Error: No provider for ${getTokenName(token)}. ${getInjectorName(name)}`;
  },
  THROW_DECORATOR_MISSING: (constructorName: string): string => {
    return `Injector Error: Cannot instantiate class ${constructorName} because it does not have the @Injectable decorator.`;
  },
};
