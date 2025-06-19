import {
  Constructor,
  CreateInjectorConfig,
  ExtractOutputValue,
  InjectableConstructor,
  ProviderConfig,
  ProviderToken,
} from './injector.interface';
import { INJECTOR_ERRORS, isSingleProvider } from './injector.util';

export class Injector {
  private readonly providers = new Map<ProviderToken, ProviderConfig | ProviderConfig[]>();
  private readonly resolvers = new Map<ProviderToken, unknown>();

  private readonly parent?: Injector;
  private readonly name?: string;

  constructor(config: { parent?: Injector; name?: string }) {
    this.parent = config.parent;
    this.name = config.name;
  }

  /**
   * @description Creates a new instance of the `Injector` class.
   *
   * @param config Configuration object used to initialize the injector.
   * - `providers`: An array of provider definitions used to resolve dependencies.
   * - `parent` (optional): An optional parent injector to fall back to when a provider is not found locally.
   * - `name` (optional): A developer-defined name used for debugging and error reporting.
   * @returns A new `Injector` instance configured with the given providers and options.
   *
   * @remarks If no providers are passed, a warning will be logged to the console.
   **/
  static create(config: CreateInjectorConfig): Injector {
    const injector = new Injector({ parent: config.parent, name: config.name });

    if (config.providers.length) {
      for (const provider of config.providers) {
        injector.provide(provider);
      }
    } else {
      console.warn(INJECTOR_ERRORS.EMPTY_PROVIDERS(config.name));
    }

    return injector;
  }

  /**
   * @description Retrieves an instance from the injector based on the provided token.
   *
   * @param token The provider token used to retrieve the instance.
   * @returns The resolved instance associated with the token.
   * @throws Error If no provider is found for the given token.
   *
   * @remarks If the token is not found in the current injector,
   * the method delegates resolution to the parent injector (if present).
   **/
  get<T extends ProviderToken, Output extends ExtractOutputValue<T>>(token: T): Output {
    return this.internalGet(token, this.name);
  }

  /**
   * `internalGet` was extracted as a separate method to preserve the original injector's name (`originName`)
   * during recursive resolution through the parent injector chain.
   *
   * This ensures accurate error reporting by indicating where the resolution started,
   * even if the token is eventually found in a parent injector.
   *
   * It's a technical layer that supports:
   * - consistent origin tracking;
   * - recursive lookup logic;
   * - and clean separation of concerns in the public `get()` API.
   **/
  private internalGet<T extends ProviderToken, Output extends ExtractOutputValue<T>>(
    token: T,
    originName?: string,
  ): Output {
    const providerConfig = this.providers.get(token);
    const resolver = this.resolvers.get(token);

    if (!providerConfig && this.parent) {
      return this.parent.internalGet(token, originName);
    }

    if (resolver) {
      return resolver as Output;
    } else {
      this.resolve(token, originName);
    }

    return this.resolvers.get(token) as Output;
  }

  /**
   * @description Registers a provider in the injector.
   * Handles both single and multi-provider configurations.
   * If a multi provider is added for an existing token, it merges the configurations into an array.
   * Clears any previously resolved instance for the given token to allow proper re-resolution.
   *
   * @param providerConfig - The provider configuration to register.
   **/
  private provide(providerConfig: ProviderConfig): void {
    const token = typeof providerConfig === 'function' ? providerConfig : providerConfig.provide;

    if (isSingleProvider(providerConfig)) {
      // If config is:
      // 1. A class (constructor);
      // 2. Config does not have a "multi" field;
      // 3. "Multi" field is false.
      this.providers.set(token, providerConfig);
    } else {
      // Multi-provider:
      // 1. config has "multi: true";
      // 2. Need to be combined with other multi-providers by the same token.
      const existingProviderConfig = this.providers.get(token);

      if (Array.isArray(existingProviderConfig)) {
        // If there is already an array of providers, just add a new one.
        existingProviderConfig.push(providerConfig);
      } else if (existingProviderConfig) {
        // If there is already one regular provider (not an array), turn it into an array + add a new one.
        this.providers.set(token, [existingProviderConfig, providerConfig]);
      } else {
        // There is no provider yet - create an array of one element.
        this.providers.set(token, [providerConfig]);
      }
    }

    // Clear the resolver cache for this token so that the next get() dependency is recreated with the new data.
    if (this.resolvers.has(token)) {
      this.resolvers.delete(token);
    }
  }

  /**
   * @description Resolves a provider by its token and stores the result in the internal cache (`resolvers`).
   * If the provider is not found in the current injector, an error is thrown with the name of the injector
   * that initiated the request (`originName`). Supports both single and multi-provider configurations.
   *
   * @param token - The token used to look up the provider.
   * @param originName - The name of the injector where the resolution started (used for better error messages).
   * @throws Error if the token is not registered in the current injector.
   **/
  private resolve(token: ProviderToken, originName?: string): void {
    const configByToken = this.providers.get(token);

    if (!configByToken) {
      throw new Error(INJECTOR_ERRORS.PROVIDER_NOT_FOUND(token, originName));
    }

    if (Array.isArray(configByToken)) {
      const resolvers = configByToken.map(config =>
        this.getResolvedSingleProvider(config, originName),
      );
      this.resolvers.set(token, resolvers);
    } else {
      this.resolvers.set(token, this.getResolvedSingleProvider(configByToken, originName));
    }
  }

  /**
   * @description Resolves a single provider configuration into its actual value or instance.
   * Handles different types of provider strategies:
   * - Class constructors (useClass or direct class).
   * - Static values (useValue).
   * - Factory functions (useFactory with optional dependencies).
   * - Aliased providers (useExisting).
   *
   * This method is used internally by `resolve` and assumes that the provided config is valid.
   *
   * @param providerConfig - The configuration object or class constructor to resolve.
   * @param originName - The name of the injector that initiated the resolution (for error context).
   * @returns The resolved instance or value for the provider.
   **/
  private getResolvedSingleProvider(providerConfig: ProviderConfig, originName?: string): any {
    if (typeof providerConfig === 'function') {
      return this.createClassInstance(providerConfig, originName);
    } else if ('useClass' in providerConfig) {
      return this.createClassInstance(providerConfig.useClass, originName);
    } else if ('useValue' in providerConfig) {
      return providerConfig.useValue;
    } else if ('useFactory' in providerConfig) {
      const depsList = providerConfig.deps ?? [];
      const resolvedDeps = depsList.map(token => this.internalGet(token, originName));

      return providerConfig.useFactory(...resolvedDeps);
    } else {
      return this.internalGet(providerConfig.useExisting, originName);
    }
  }

  /** Creates an instance of a dependency by resolving its constructor dependencies.
   * Uses `Reflect.getMetadata` to retrieve the list of dependencies defined in the constructor
   * and recursively resolves each dependency.
   **/
  private createClassInstance<T extends InjectableConstructor, Instance extends InstanceType<T>>(
    constructor: T,
    originName?: string,
  ): Instance {
    if (!constructor.injectable || !constructor.uniqueServiceId) {
      throw new Error(
        `Cannot instantiate class ${constructor.name} because it does not have a @Injectable decorator.`,
      );
    }

    const depsList: Constructor[] = Reflect.getMetadata('design:paramtypes', constructor) ?? [];
    const resolvedDeps = depsList.map(dependency => this.internalGet(dependency, originName));

    return new constructor(...resolvedDeps) as Instance;
  }
}
