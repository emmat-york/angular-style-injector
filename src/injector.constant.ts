import {getID} from "./injector.util";

export class InjectionToken<T> {
  private readonly uniqueDesc: string;
  private readonly id = getID();

  constructor(uniqueDesc: string) {
    this.uniqueDesc = uniqueDesc;
  }

  get description(): string {
    return this.uniqueDesc;
  }

  get identifier(): string {
    return this.id;
  }
}
