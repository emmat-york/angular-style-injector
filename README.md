# Angular-Style Injector

A lightweight dependency injection container inspired by Angular's Injector.

## Installation

```bash
npm install angular-style-injector
```

## Preconditions

Before you start using this package, make sure to complete the following steps:

1. Import `reflect-metadata` once in your entry point `.ts` file (`main.ts` or maybe `index.ts`):

```ts
import 'reflect-metadata';
```

2. Add these two essential parameters to your `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Usage

```ts
import { Injector, Injectable, InjectionToken } from 'angular-style-injector';

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
    readonly depOne: DependencyOne,
    readonly depTwo: DependencyTwo,
  ) {}
}

const CLASS_TOKEN = new InjectionToken<Parent>('Class token');
const VALUE_TOKEN = new InjectionToken<number>('Value token');
const FACTORY_TOKEN = new InjectionToken<string>('Factory token');
const EXISTING_TOKEN = new InjectionToken<number>('Existing token');

const injector = Injector.create({
  providers: [
    DependencyOne,
    DependencyTwo,
    { provide: CLASS_TOKEN, useClass: Parent },
    { provide: VALUE_TOKEN, useValue: 10, multi: true },
    { provide: VALUE_TOKEN, useValue: 20, multi: true },
    { provide: EXISTING_TOKEN, useExisting: VALUE_TOKEN },
  ],
  parent: Injector.create({
    providers: [
      DependencyTwo,
      {
        provide: FACTORY_TOKEN,
        useFactory: (depTwo: DependencyTwo) => depTwo.description,
        deps: [DependencyTwo],
      },
    ],
    name: 'Parent injector',
  }),
  name: 'Origin injector',
});

console.log(
  injector.get(CLASS_TOKEN), // instance of Parent class
  injector.get(VALUE_TOKEN), // Array: [10, 20]
  injector.get(FACTORY_TOKEN), // String: 'Dependency two'
  injector.get(EXISTING_TOKEN), // Array: [10, 20]
);
```


### Optional Dependencies and Fallback Values

You can control how the `Injector` resolves missing dependencies using the optional `notFoundValue` and `InjectOptions`.

#### Using `notFoundValue`

```ts
const injector = Injector.create({ providers: [] });
const value = injector.get(new InjectionToken('MISSING_TOKEN'), 'Default Value');
console.log(value); // "Default Value"
```

#### Using `InjectOptions`

You can provide options like `optional`, `self`, and `skipSelf` to control resolution behavior:

```ts
const token = new InjectionToken<string>('TestToken');

const parent = Injector.create({ providers: [{ provide: token, useValue: 'from parent' }] });
const child = Injector.create({ providers: [], parent });

const value1 = child.get(token); // "from parent"

const value2 = child.get(token, undefined, { self: true }); // throws Error
const value3 = child.get(token, null, { optional: true });  // returns null
```

`InjectOptions` interface:
```ts
interface InjectOptions {
  optional?: boolean; // if true, returns null when token is not found
  self?: boolean;     // if true, only checks current injector
  skipSelf?: boolean; // if true, skips current injector and looks up the parent chain
}
```
