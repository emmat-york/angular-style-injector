import {
  Constructor,
  CreateInjectorConfig,
  ExtractOutputValue,
  InjectableConstructor,
  ProviderConfig,
  ProviderToken,
} from './injector.interface';
import { getTokenName, isSingleProvider } from './injector.util';

export class Injector {
  private readonly providers = new Map<ProviderToken, ProviderConfig | ProviderConfig[]>();
  private readonly resolvers = new Map<ProviderToken, unknown>();

  private readonly parent?: Injector;
  private readonly name?: string;

  constructor(config: { parent?: Injector; name?: string }) {
    this.parent = config.parent;
    this.name = config.name;
  }

  static create({ providers, parent, name }: CreateInjectorConfig): Injector {
    const injector = new Injector({ parent, name });

    if (providers.length) {
      for (const provider of providers) {
        injector.provide(provider);
      }
    } else {
      console.warn(
        'Injector created without any providers. Consider adding providers to enable dependency resolution.',
      );
    }

    return injector;
  }

  get<T extends ProviderToken, Output extends ExtractOutputValue<T>>(token: T): Output {
    return this.internalGet(token, this.name);
  }

  // Method to retrieve a resolved dependency by its token. If the dependency is already resolved,
  // it returns the cached value from resolvers. Otherwise, it initiates the resolution process.
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

  // Method for resolving a dependency by its token. Determines how to create a value for the token based on its configuration.
  private resolve(token: ProviderToken, originName?: string): void {
    const configByToken = this.providers.get(token);

    if (!configByToken) {
      throw new Error(
        `No provider for ${getTokenName(token)}. ${
          originName ? `Injector's name: ${originName}` : ''
        }`,
      );
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

  // Creates an instance of a dependency by resolving its constructor dependencies.
  // Uses `Reflect.getMetadata` to retrieve the list of dependencies defined in the constructor
  // and recursively resolves each dependency.
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
