import { ProviderConfig, ProviderToken } from './injector.interface';

const idGenerator = (): ((prefix?: string) => string) => {
  const collection = new Set<string>();

  return function generate(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    const id = prefix + timestamp + random;

    if (collection.has(id)) {
      return generate(prefix);
    } else {
      collection.add(id);
      return id;
    }
  }
};

export const isSingleProvider = (config: ProviderConfig): boolean => {
  return typeof config === 'function' || !('multi' in config) || !config.multi;
};

export const getTokenName = (token: ProviderToken): string => {
  return typeof token === 'function' ? token.name : token.description;
};

export const getID = idGenerator();
