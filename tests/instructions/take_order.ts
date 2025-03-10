import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import * as borsh from 'borsh';
import { Assignable, LimitOrderInstruction } from '../instruction';

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
          ['amount' , 'u64'],
          ['price', 'u64'] 
        ],
      },
    ],
  ]);
  
  export function buildTakeOrder(props : {
    amount : BN,
    price : BN,
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
        instruction : LimitOrderInstruction.TakeOrder,
        amount : props.amount,
        price : props.price
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