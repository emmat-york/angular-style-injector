import {
  Constructor,
  CreateInjectorConfig,
  ExtractOutputValue,
  InjectableConstructor,
  InjectOptions,
  ProviderConfig,
  ProviderToken,
} from './injector.interface';
import { INJECTOR_ERRORS, isSingleProvider } from './injector.constant';

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
      console.warn(INJECTOR_ERRORS.EMPTY_PROVIDERS_WARN(config.name));
    }

    return injector;
  }

  /**
   * @description Retrieves an instance from the injector based on the provided token.
   *
   * @param token The provider token used to retrieve the instance.
   * @param notFoundValue A fallback value to return if the token is not provided by this injector or its parents.
   * @param options Configuration object that influences how a dependency is resolved by the injector.
   * - `optional` (optional): If true, the injector returns `null` instead of throwing an error when the token was not found.
   * - `skipSelf` (optional): If true, the injector skips checking itself and instead delegates resolution to its parent (if presents).
   * - `self` (optional): If true, the injector only looks for the dependency in itself and does not check the parent injector (if presents).
   * @returns The resolved instance associated with the token.
   * @throws Error If the provider cannot be found in the current or parent injectors, and neither a `notFoundValue`
   * nor the `optional` flag was provided in the options.
   *
   * @remarks If the token is not found in the current injector,
   * the method delegates resolution to the parent injector (if present).
   **/
  get<T extends ProviderToken, Output extends ExtractOutputValue<T>>(
    token: T,
    notFoundValue?: Output,
    options?: InjectOptions,
  ): Output {
    return this.internalGet(token, this.name, notFoundValue, options);
  }

  /**
   * @description This method was extracted as a separate method to preserve
   * the original injector's name `originName` and `notFoundValue` during
   * recursive resolution through the parent injector chain.
   **/
  private internalGet<T extends ProviderToken, Output extends ExtractOutputValue<T>>(
    token: T,
    originName?: string,
    notFoundValue?: Output,
    options?: InjectOptions,
  ): Output {
    const { optional, self, skipSelf } = options ?? {};

    const shouldCheckSelf = !skipSelf || self;
    const shouldCheckParent = !self;

    if (shouldCheckSelf) {
      const resolver = this.resolvers.get(token);

      if (resolver) {
        return resolver as Output;
      }

      const provider = this.providers.get(token);

      if (provider) {
        this.resolve(token, provider, originName);
        return this.resolvers.get(token) as Output;
      }
    }

    if (shouldCheckParent && this.parent) {
      return this.parent.internalGet(token, originName, notFoundValue);
    }

    if (notFoundValue !== undefined) {
      return notFoundValue;
    }

    if (optional) {
      return null as Output;
    }

    throw new Error(INJECTOR_ERRORS.THROW_PROVIDER_NOT_FOUND(token, originName));
  }

  /**
   * @description Registers a provider in the injector.
   * Handles both single and multi-provider configurations.
   * If a multi provider is added for an existing token, it merges the configurations into an array.
   * Clears any previously resolved instance for the given token to allow proper re resolution.
   *
   * @param providerConfig The provider configuration to register.
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
      // 1. Config has "multi: true";
      // 2. Need to be combined with other multi-providers by the same token.
      const existingProviderConfig = this.providers.get(token);

      if (Array.isArray(existingProviderConfig)) {
        // If there is already an array of providers, add a new one.
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
   *
   * @param token The token used to look up the provider.
   * @param provider The actual provider configuration(s) associated with the token.
   * @param originName The name of the injector that initiated the resolution.
   **/
  private resolve(
    token: ProviderToken,
    provider: ProviderConfig | ProviderConfig[],
    originName?: string,
  ): void {
    if (Array.isArray(provider)) {
      const resolvers = provider.map(config => this.getResolvedSingleProvider(config, originName));
      this.resolvers.set(token, resolvers);
    } else {
      this.resolvers.set(token, this.getResolvedSingleProvider(provider, originName));
    }
  }

  /**
   * @description Resolves a single provider configuration into its actual value or instance.
   *
   * @param providerConfig The configuration object or class constructor to resolve.
   * @param originName The name of the injector that initiated the resolution.
   * @returns The resolved instance or value for the provider.
   **/
  private getResolvedSingleProvider(providerConfig: ProviderConfig, originName?: string): unknown {
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

  /**
   * @description Creates an instance of a dependency by resolving its constructor dependencies.
   * Uses `Reflect.getMetadata` to retrieve the list of dependencies defined in the constructor
   * and recursively resolves each dependency.
   *
   * @param constructor A class constructor
   * @param originName The name of the injector that initiated the resolution.
   * @return The class instance with resolved dependencies.
   **/
  private createClassInstance<T extends InjectableConstructor, Instance extends InstanceType<T>>(
    constructor: T,
    originName?: string,
  ): Instance {
    if (!constructor.__injectable__) {
      throw new Error(INJECTOR_ERRORS.THROW_DECORATOR_MISSING(constructor.name));
    }

    const depsList: Constructor[] = Reflect.getMetadata('design:paramtypes', constructor) ?? [];
    const resolvedDeps = depsList.map(dependency => this.internalGet(dependency, originName));

    return new constructor(...resolvedDeps) as Instance;
  }
}
