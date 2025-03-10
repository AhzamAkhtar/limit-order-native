import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import * as borsh from 'borsh';
import { Assignable, LimitOrderInstruction } from '../instruction';

class CancelOrder extends Assignable {
    toBuffer() {
      return Buffer.from(borsh.serialize(CancelOrderSchema, this));
    }
  }
  
  const CancelOrderSchema = new Map([
    [
      CancelOrder,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          ['id' , 'u64'],
          ['amount', 'u64']
        ],
      },
    ],
  ]);
  
  export function buildCancelOrder(props : {
    id : BN,
    amount : BN,
    user : PublicKey;
    btc_order_book : PublicKey;
    order_book_admin_pubkey : PublicKey;
    token_mint_a : PublicKey;
    user_token_account_a : PublicKey;
    mediator_vault : PublicKey;
    program_id : PublicKey;
  }) {
    const cancel_ix = new CancelOrder({
        instruction : LimitOrderInstruction.CancelOrder,
        id : props.id,
        amount : props.amount
    });
  
    return new TransactionInstruction({
        keys : [
          {
              pubkey : props.user,
              isSigner : false,
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
            pubkey : props.user_token_account_a,
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
        data : cancel_ix.toBuffer()
    })
  }