import { InjectionToken } from './injector.constant';
import { Injector } from './injector';

export type Constructor<T = any> = new (...args: any[]) => T;

export type ProviderToken = Constructor | InjectionToken<unknown>;

export type ProviderConfig =
  | Constructor
  | { provide: ProviderToken; useClass: Constructor; multi?: boolean }
  | { provide: ProviderToken; useValue: any; multi?: boolean }
  | { provide: ProviderToken; useExisting: ProviderToken; multi?: boolean }
  | {
      provide: ProviderToken;
      useFactory: (...args: any[]) => any;
      deps?: ProviderToken[];
      multi?: boolean;
    };

export interface CreateInjectorConfig {
  providers: ProviderConfig[];
  parent?: Injector;
  name?: string;
}

export type ExtractOutputValue<T extends ProviderToken> = T extends Constructor
  ? InstanceType<T>
  : T extends InjectionToken<infer U>
    ? U
    : unknown;
