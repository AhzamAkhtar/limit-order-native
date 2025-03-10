
export class Assignable {
    constructor(properties) {
      for (const [key, value] of Object.entries(properties)) {
        this[key] = value;
      }
    }
}

export enum LimitOrderInstruction {
    Init = 0,
    CreateOrder = 1,
    TakeOrder = 2,
    CancelOrder = 3
}

