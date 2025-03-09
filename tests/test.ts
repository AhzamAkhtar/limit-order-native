import { Buffer } from 'node:buffer';
// import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { TOKEN_PROGRAM_ID , createMint, createAccount , mintTo, getAssociatedTokenAddressSync } from '@solana/spl-token';
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
import { buildCreateOrder, buildInit } from './instruction';
import { BN, min } from 'bn.js';
import { randomBytes } from 'node:crypto';
import { OrderBookData, OrderList } from './data';

const program_id = new PublicKey("J7AanLfH5JaEADzw4gc7tE8Pxz8mwSU514tjGLNrhdsC");
const connection = new Connection("http://localhost:8899","confirmed");
const program = createKeypairFromFile("./target/deploy/limit_order-keypair.json")

const write_into_file = () => {
const filePath = "./orderbook/orderbook.txt";
const orderBook = new OrderBookData(filePath);
orderBook.addOrder(new OrderList("buy", 1000, 50000));
}

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

const newMintToAta = async (connection, minter: Keypair): Promise<{ mint: PublicKey, ata: PublicKey }> => {
  const mint = await createMint(connection, minter, minter.publicKey, null, 6)
  // await getAccount(connection, mint, commitment)
  const ata = await createAccount(connection, minter, mint, minter.publicKey)
  const signature = await mintTo(connection, minter, mint, ata, minter, 21e8)
  await confirmTx(signature)
  return {
      mint,
      ata
  }
}

const order_book_admin_pubkey = Keypair.generate();
const user_creating_order = Keypair.generate();

function createValuesForInit() {

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
    btc_order_book
  }
  
}




describe("Limit_Order" , function (){


  const values = createValuesForInit()
  let values_for_create;
 
  //airdrop
    it("Airdrop", async () => {
      await Promise.all([order_book_admin_pubkey.publicKey,values.btc_order_book , user_creating_order.publicKey].map(async (k) => {
          return await connection.requestAirdrop(k, 5_000_000_000)
      })).then(confirmTxs);
      let ddd = await connection.getBalance(order_book_admin_pubkey.publicKey, "confirmed")
      console.log("ddd",ddd)
  });


    it("Init", async () => {
     try {
       const ix = buildInit({
        btc_order_book : values.btc_order_book,
        fee_payer : order_book_admin_pubkey.publicKey,
        program_id : program_id,
       })
  
       const sx = await sendAndConfirmTransaction(connection , new Transaction().add(ix) , [order_book_admin_pubkey])
       console.log("sx",sx)
       
     } catch(e) {
      console.log(e)
     }
      
  })


  it("Create Order", async () => {
    try {
      const btc_order_book = PublicKey.findProgramAddressSync(
        [
          Buffer.from('btc_order_book'),
          order_book_admin_pubkey.publicKey.toBuffer(),
        ],
        program_id
      )[0]; 
  
      console.log("btc_order_book:", btc_order_book.toBase58());
  
        const sig = await connection.requestAirdrop(user_creating_order.publicKey, 5_000_000_000);
        await confirmTx(sig);
       
      const new_mint = await newMintToAta(connection, user_creating_order);
      console.log("Mint Created:", new_mint.mint.toBase58());
      console.log("User Token Account:", new_mint.ata.toBase58());
  
      const mediator_vault = getAssociatedTokenAddressSync(
        new_mint.mint,
        btc_order_book,
        true
      );
      console.log("Mediator Vault:", mediator_vault.toBase58());

      const ix = buildCreateOrder({
      side : "buy",
      amount: new BN(1 * 10 ** 6),
      price: new BN(1 * 10 ** 6),
      //is_expiry : Boolean(false),
       user : user_creating_order.publicKey,
       btc_order_book : btc_order_book,
       order_book_admin_pubkey : order_book_admin_pubkey.publicKey,
       token_mint : new_mint.mint,
       user_token_account : new_mint.ata,
       mediator_vault : mediator_vault,
       program_id : program_id,
      })
 
      const sx = await sendAndConfirmTransaction(connection , new Transaction().add(ix) , [user_creating_order])
      console.log("sx",sx)
      write_into_file()
    } catch(e) {
     console.log(e)
    }
     
 })

})