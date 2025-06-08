import { ProviderConfig, ProviderToken } from './injector.interface';

export const getTokenName = (token: ProviderToken): string => {
  return typeof token === 'function' ? token.name : token.description;
};

export const isSingleProvider = (config: ProviderConfig): boolean => {
  return typeof config === 'function' || !('multi' in config) || !config.multi;
};

export const generateId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let resultId = '';

  for (let i = 0; i < 20; i++) {
    resultId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return resultId;
}
