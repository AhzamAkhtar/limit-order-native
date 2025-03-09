import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import * as borsh from 'borsh';

class Assignable {
    constructor(properties) {
      for (const [key, value] of Object.entries(properties)) {
        this[key] = value;
      }
    }
}

enum LimitOrderInstruction {
    Init = 0,
    CreateOrder = 1,
    TakeOrder = 2
}

class Init extends Assignable {
    toBuffer() {
      return Buffer.from(borsh.serialize(InitSchema, this));
    }
}

const InitSchema = new Map([
    [
      Init,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
        ],
      },
    ],
]);

export function buildInit(props : {
    btc_order_book : PublicKey;
    fee_payer : PublicKey;
    program_id : PublicKey;
}) {
    const ix = new Init({
        instruction : LimitOrderInstruction.Init,
    });

    return new TransactionInstruction({
        keys : [
            {
                pubkey : props.btc_order_book,
                isSigner : false,
                isWritable : true
            },
            {
                pubkey : props.fee_payer,
                isSigner : true,
                isWritable : true
            },
            {
                pubkey : SystemProgram.programId,
                isSigner : false,
                isWritable : false
            },
        ],
        programId : props.program_id,
        data : ix.toBuffer()
    })
}

class CreateOrder extends Assignable {
  toBuffer() {
    return Buffer.from(borsh.serialize(CreateOrderSchema, this));
  }
}

const CreateOrderSchema = new Map([
  [
    CreateOrder,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['side', 'String'],
        ['amount','u64'],
        ['price', 'u64'],
      ],
    },
  ],
]);

export function buildCreateOrder(props : {
  side : string,
  amount : BN,
  price : BN,
  //is_expiry : Boolean,
  user : PublicKey;
  btc_order_book : PublicKey;
  order_book_admin_pubkey : PublicKey;
  token_mint : PublicKey;
  user_token_account : PublicKey;
  mediator_vault : PublicKey;
  program_id : PublicKey;
}) {
  const create_ix = new CreateOrder({
      instruction : LimitOrderInstruction.CreateOrder,
      side : props.side,
      amount : new BN(props.amount),
      price : new BN(props.price),
      //is_expiry : Boolean(props.is_expiry)
  });

  return new TransactionInstruction({
      keys : [
        {
            pubkey : props.user,
            isSigner : true,
            isWritable : true
        },
          {
              pubkey : props.btc_order_book,
              isSigner : false,
              isWritable : true
          },
          {
            pubkey : props.order_book_admin_pubkey,
            isSigner : false,
            isWritable : true
        },
          {
            pubkey : props.token_mint,
            isSigner : false,
            isWritable : false
        },
        {
          pubkey : props.user_token_account,
          isSigner : false,
          isWritable : true
        },
        {
          pubkey : props.mediator_vault,
          isSigner : false,
          isWritable : true
         },
        {
          pubkey : TOKEN_PROGRAM_ID,
          isSigner : false,
          isWritable : false
        },
        {
            pubkey : ASSOCIATED_TOKEN_PROGRAM_ID,
            isSigner : false,
            isWritable : false
        },
        {
          pubkey : SystemProgram.programId,
          isSigner : false,
          isWritable : false
      },
      ],
      programId : props.program_id,
      data : create_ix.toBuffer()
  })
}


class TakeOrder extends Assignable {
  toBuffer() {
    return Buffer.from(borsh.serialize(TakeOrderSchema, this));
  }
}

const TakeOrderSchema = new Map([
  [
    TakeOrder,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
      ],
    },
  ],
]);

export function buildTakeOrder(props : {
  user : PublicKey;
  taker : PublicKey;
  btc_order_book : PublicKey;
  order_book_admin_pubkey : PublicKey;
  token_mint_a : PublicKey;
  token_mint_b : PublicKey;
  user_token_account_b : PublicKey;
  taker_token_account_a : PublicKey;
  taker_token_account_b : PublicKey;
  mediator_vault : PublicKey;
  program_id : PublicKey;
}) {
  const take_ix = new TakeOrder({
      instruction : LimitOrderInstruction.TakeOrder
  });

  return new TransactionInstruction({
      keys : [
        {
            pubkey : props.user,
            isSigner : false,
            isWritable : true
        },
        {
          pubkey : props.taker,
          isSigner : true,
          isWritable : true
      },
          {
              pubkey : props.btc_order_book,
              isSigner : false,
              isWritable : true
          },
          {
            pubkey : props.order_book_admin_pubkey,
            isSigner : false,
            isWritable : true
        },
          {
            pubkey : props.token_mint_a,
            isSigner : false,
            isWritable : false
        },
        {
          pubkey : props.token_mint_b,
          isSigner : false,
          isWritable : false
      },
        {
          pubkey : props.user_token_account_b,
          isSigner : false,
          isWritable : true
        },
        {
          pubkey : props.taker_token_account_a,
          isSigner : false,
          isWritable : true
        },
        {
          pubkey : props.taker_token_account_b,
          isSigner : false,
          isWritable : true
        },
        {
          pubkey : props.mediator_vault,
          isSigner : false,
          isWritable : true
         },
        {
          pubkey : TOKEN_PROGRAM_ID,
          isSigner : false,
          isWritable : false
        },
        {
            pubkey : ASSOCIATED_TOKEN_PROGRAM_ID,
            isSigner : false,
            isWritable : false
        },
        {
          pubkey : SystemProgram.programId,
          isSigner : false,
          isWritable : false
      },
      ],
      programId : props.program_id,
      data : take_ix.toBuffer()
  })
}
