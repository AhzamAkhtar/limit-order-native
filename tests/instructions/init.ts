import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import * as borsh from 'borsh';
import { Assignable, LimitOrderInstruction } from '../instruction';

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
