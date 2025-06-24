# Angular-Style Injector

A lightweight dependency injection container inspired by Angular's Injector.

## Installation

```bash
npm install angular-style-injector
```

## Preconditions

Before you start using this package, make sure to complete the following steps:

1. Import `reflect-metadata` once in your entry point `.ts` file (`main.ts` or maybe `index.ts`).
   Also, this import must be the first import in the file:

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
class Child {
  readonly description = 'Child';
}

@Injectable()
class Parent {
  readonly description = 'Parent';

  constructor(readonly child: Child) {}
}

const CLASS_TOKEN = new InjectionToken<Parent>('useClass');
const VALUE_TOKEN = new InjectionToken<number[]>('useValue');
const FACTORY_TOKEN = new InjectionToken<number>('useFactory');
const EXISTING_TOKEN = new InjectionToken<number>('useExisting');

const injector = Injector.create({
  providers: [
    Child,
    { provide: CLASS_TOKEN, useClass: Parent },
    { provide: VALUE_TOKEN, useValue: 10, multi: true },
    { provide: VALUE_TOKEN, useValue: 20, multi: true },
    { provide: EXISTING_TOKEN, useExisting: VALUE_TOKEN },
  ],
  parent: Injector.create({
    providers: [
      {
        provide: FACTORY_TOKEN,
        useFactory: (array: number[]) => array.reduce((acc, num) => acc + num, 0),
        deps: [VALUE_TOKEN],
      },
    ],
    name: 'Parent injector',
  }),
  name: 'Origin injector',
});

console.log(
  injector.get(CLASS_TOKEN), // instance of Parent class with necessary deps
  injector.get(VALUE_TOKEN), // Array: [10, 20]
  injector.get(FACTORY_TOKEN), // Number: 30
  injector.get(EXISTING_TOKEN), // Array: [10, 20]
);
```

### Optional Dependencies and Fallback Values

You can control how the `Injector` resolves missing dependencies using the optional `notFoundValue`
and `InjectOptions`.

Using `notFoundValue`

```ts
const MISSING_TOKEN = new InjectionToken('Missing');

const injector = Injector.create({
  providers: [],
});

console.log(injector.get(MISSING_TOKEN, 'Default Value')); // "Default Value"
```

Using `InjectOptions`

You can provide options like `optional`, `self`, and `skipSelf` to control resolution behavior:

```ts
interface InjectOptions {
  optional?: boolean; // if true, returns null when token is not found
  self?: boolean;     // if true, only checks current injector
  skipSelf?: boolean; // if true, skips current injector and looks up the parent chain
}

const TOKEN = new InjectionToken<string>('useValue');

const parentInjector = Injector.create({
  providers: [{ provide: TOKEN, useValue: 'from parent' }]
});

const childInjector = Injector.create({
  providers: [], 
  parent: parentInjector
});

console.log(
  childInjector.get(TOKEN), // "from parent"
  childInjector.get(TOKEN, undefined, { self: true }), // throws Error
  childInjector.get(TOKEN, null, { optional: true })  // returns null
);
```
