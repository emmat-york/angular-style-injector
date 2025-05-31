# Angular-Style Injector

A lightweight dependency injection container inspired by Angular's Injector.

## Installation

```bash
npm install angular-style-injector
```

## Usage

Make sure to import `reflect-metadata` once in your entry point:

```ts
import 'reflect-metadata';
```

Then you can use the Injector as follows:

```ts
import { Injector } from 'angular-style-injector';

const injector = new Injector();
injector.create(SomeClass);
```
