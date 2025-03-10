import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import * as borsh from 'borsh';
import { Assignable, LimitOrderInstruction } from '../instruction';

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
          ['id', 'u64'],
          ['side', 'String'],
          ['amount','u64'],
          ['price', 'u64'],
        ],
      },
    ],
  ]);
  
  export function buildCreateOrder(props : {
    id : BN,
    side : string,
    amount : BN,
    price : BN,
    user : PublicKey;
    manager : PublicKey;
    manager_auth : PublicKey;
    token_mint : PublicKey;
    user_token_account : PublicKey;
    mediator_vault : PublicKey;
    program_id : PublicKey;
  }) {
    const create_ix = new CreateOrder({
        instruction : LimitOrderInstruction.CreateOrder,
        id : props.id,
        side : props.side,
        amount : new BN(props.amount),
        price : new BN(props.price),
    });
  
    return new TransactionInstruction({
        keys : [
          {
              pubkey : props.user,
              isSigner : true,
              isWritable : true
          },
            {
                pubkey : props.manager,
                isSigner : false,
                isWritable : true
            },
            {
              pubkey : props.manager_auth,
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