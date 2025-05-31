import { ProviderConfig, ProviderToken } from './injector.interface';

export const getTokenName = (token: ProviderToken): string => {
  return typeof token === 'function' ? token.name : token.uniqueDesc;
};

export const isSingleProvider = (config: ProviderConfig): boolean => {
  return typeof config === 'function' || !('multi' in config) || !config.multi;
};
