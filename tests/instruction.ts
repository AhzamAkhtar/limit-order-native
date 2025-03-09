import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
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
        instructions : LimitOrderInstruction.Init,
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