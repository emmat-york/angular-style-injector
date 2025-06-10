# Angular-Style Injector

A lightweight dependency injection container inspired by Angular's Injector.

## Installation

```bash
npm install angular-style-injector
```

## Preconditions
Before you start using this package, make sure to complete the following steps first:

1. Import `reflect-metadata` once in your entry point `.ts` file:

```ts
import 'reflect-metadata';
```
2. Add these two essential parameters to your `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  }
}
```

## Usage

```ts
import {Injector, Injectable, InjectionToken} from 'angular-style-injector';

@Injectable()
class DependencyOne {
    readonly description = 'Dependency one';
}

@Injectable()
class DependencyTwo {
    readonly description = 'Dependency two';
}

@Injectable()
class Parent {
    readonly description = 'Parent';

    constructor(
        readonly dependencyOne: DependencyOne,
        readonly dependencyTwo: DependencyTwo,
    ) {
    }
}

const CLASS_TOKEN = new InjectionToken<Parent>('CLASS_TOKEN');
const VALUE_TOKEN = new InjectionToken<number>('VALUE_TOKEN');
const FACTORY_TOKEN = new InjectionToken<string>('FACTORY_TOKEN');
const EXISTING_TOKEN = new InjectionToken<number>('EXISTING_TOKEN');

const injector = Injector.create({
    providers: [
        DependencyOne,
        DependencyTwo,
        {provide: CLASS_TOKEN, useClass: Parent},
        {provide: VALUE_TOKEN, useValue: 10, multi: true},
        {provide: VALUE_TOKEN, useValue: 20, multi: true},
        {provide: EXISTING_TOKEN, useExisting: VALUE_TOKEN},
    ],
    parent: Injector.create({
        providers: [
            DependencyTwo,
            {
                provide: FACTORY_TOKEN,
                useFactory: (dependencyTwo: DependencyTwo) => dependencyTwo.description,
                deps: [DependencyTwo],
            },
        ],
        name: 'parentInjector',
    }),
    name: 'elementInjector',
});

console.log(
    injector.get(CLASS_TOKEN), // instance of Parent class
    injector.get(VALUE_TOKEN), // Array: [10, 20]
    injector.get(FACTORY_TOKEN), // String: 'Dependency two'
    injector.get(EXISTING_TOKEN), // Array: [10, 20]
);
```
