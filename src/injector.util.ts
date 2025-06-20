import { ProviderConfig } from './injector.interface';

const idGenerator = (): ((prefix?: string) => string) => {
  const idsCollection = new Set<string>();

  return function generate(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    const id = prefix + timestamp + random;

    if (idsCollection.has(id)) {
      return generate(prefix);
    } else {
      idsCollection.add(id);
      return id;
    }
  };
};

export const isSingleProvider = (config: ProviderConfig): boolean => {
  return typeof config === 'function' || !('multi' in config) || !config.multi;
};

export const getID = idGenerator();
