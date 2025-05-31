export class InjectionToken<T> {
  readonly uniqueDesc: string;

  constructor(uniqueDesc: string) {
    this.uniqueDesc = uniqueDesc;
  }
}
