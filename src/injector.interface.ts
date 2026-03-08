import { InjectionToken } from './injector.util';

export type Constructor = { new (...args: any[]): object };

export type InjectableConstructor = Constructor & {
  __injectable__?: true;
};

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

export type InjectOptionsBase = {
  skipSelf?: boolean;
  self?: boolean;
};

export type OptionalInjectOptions = InjectOptionsBase & {
  optional: true;
};

export type RequiredInjectOptions = InjectOptionsBase & {
  optional?: false;
};

export interface InjectOptions {
  optional?: boolean;
  skipSelf?: boolean;
  self?: boolean;
}

export type ExtractOutputValue<T extends ProviderToken> = T extends Constructor
  ? InstanceType<T>
  : T extends InjectionToken<infer U>
    ? U
    : unknown;
