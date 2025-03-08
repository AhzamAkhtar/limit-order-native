import { PublicKey } from '@solana/web3.js';
import * as borsh from 'borsh';

export class OrderBook {
  orders: OrderList[];
  authority: Uint8Array;
  bump: number;

  constructor(orderBook: OrderBookRaw) {
    this.orders = orderBook.orders.map(order => new OrderList(order));
    this.authority = orderBook.authority;
    this.bump = orderBook.bump;
  }

  toBuffer() {
    return Buffer.from(borsh.serialize(OrderBookSchema, this));
  }

  static fromBuffer(buffer: Uint8Array) {
    return borsh.deserialize(OrderBookSchema, OrderBook, Buffer.from(buffer));
  }

  toData(): OrderBookData {
    return {
      orders: this.orders.map(order => order.toData()),
      authority: new PublicKey(this.authority),
      bump: this.bump,
    };
  }
}

export class OrderList {
  side: string;
  amount_token_for_trade: bigint;
  price: bigint;
  is_expiry: boolean;

  constructor(order: OrderListRaw) {
    this.side = order.side;
    this.amount_token_for_trade = order.amount_token_for_trade;
    this.price = order.price;
    this.is_expiry = order.is_expiry;
  }

  toData(): OrderListData {
    return {
      side: this.side,
      amount_token_for_trade: this.amount_token_for_trade,
      price: this.price,
      is_expiry: this.is_expiry,
    };
  }
}

const OrderListSchema = {
  kind: 'struct',
  fields: [
    ['side', 'string'], // String type
    ['amount_token_for_trade', 'u64'],
    ['price', 'u64'],
    ['is_expiry', 'u8'], // Boolean stored as u8 (0 or 1)
  ],
};

const OrderBookSchema = new Map([
  [
    OrderBook,
    {
      kind: 'struct',
      fields: [
        ['orders', { kind: 'vec', type: OrderListSchema }], // Corrected array of structs
        ['authority', [32]], // PublicKey as 32 bytes
        ['bump', 'u8'],
      ],
    },
  ],
]);

type OrderBookRaw = {
  orders: OrderListRaw[];
  authority: Uint8Array;
  bump: number;
};

type OrderListRaw = {
  side: string;
  amount_token_for_trade: bigint;
  price: bigint;
  is_expiry: boolean;
};

type OrderBookData = {
  orders: OrderListData[];
  authority: PublicKey;
  bump: number;
};

type OrderListData = {
  side: string;
  amount_token_for_trade: bigint;
  price: bigint;
  is_expiry: boolean;
};

export { OrderBookSchema };
