import { Buffer } from 'node:buffer';
// import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as borsh from 'borsh'
import { buildInit } from './instruction';
import { BN } from 'bn.js';
import { randomBytes } from 'node:crypto';

const program_id = new PublicKey("J7AanLfH5JaEADzw4gc7tE8Pxz8mwSU514tjGLNrhdsC");
const connection = new Connection("http://localhost:8899","confirmed");

function createKeypairFromFile(path: string): Keypair {
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(require('node:fs').readFileSync(path, 'utf-8'))));
}

const confirmTx = async (signature: string) => {
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
      {
          signature,
          ...latestBlockhash,
      },
      "confirmed"
  )
}


const confirmTxs = async (signatures: string[]) => {
  await Promise.all(signatures.map(confirmTx))
}


 function createValuesForInit() {
  
  const order_book_admin_pubkey = Keypair.generate();
  
  const btc_order_book = PublicKey.findProgramAddressSync(
    [
      Buffer.from('btc_order_book'),
      order_book_admin_pubkey.publicKey.toBuffer(),
    ],
    program_id
  )[0]; 
  
  console.log("order_book", btc_order_book)
  console.log("admin", order_book_admin_pubkey.publicKey)
  
  return {
    program_id,
    order_book_admin_pubkey,
    btc_order_book
  }
  
}



describe("Limit_Order" , () => {

  const values = createValuesForInit()
  // let airdrop_sig_2 = await connection.requestAirdrop(values.btc_order_book, 1_000_000_000);
  // console.log(airdrop_sig)
  const program = createKeypairFromFile("./target/deploy/limit_order-keypair.json")

  //airdrop

    it("Starting", async () => {
        console.log("Heloo , im running")
    })


    it("Airdrop", async () => {
      await Promise.all([values.order_book_admin_pubkey.publicKey,values.btc_order_book].map(async (k) => {
          return await connection.requestAirdrop(k, 5_000_000_000)
      })).then(confirmTxs);
      let ddd = await connection.getBalance(values.order_book_admin_pubkey.publicKey, "confirmed")
      console.log("ddd",ddd)
  });


    it("Init", async () => {
     try {

       const ix = buildInit({
        btc_order_book : values.btc_order_book,
        fee_payer : values.order_book_admin_pubkey.publicKey,
        program_id : program_id,
       })
  
       const sx = await sendAndConfirmTransaction(connection , new Transaction().add(ix) , [values.order_book_admin_pubkey])
       console.log("sx",sx)
     } catch(e) {
      console.log(e)
     }
      
  })

})