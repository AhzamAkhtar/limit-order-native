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
import { buildCancelOrder, buildCreateOrder, buildInit, buildTakeOrder } from './instruction';
import { BN, min } from 'bn.js';
import { randomBytes } from 'node:crypto';
import { OrderBookData, OrderList } from './data';

const program_id = new PublicKey("J7AanLfH5JaEADzw4gc7tE8Pxz8mwSU514tjGLNrhdsC");
const connection = new Connection("http://localhost:8899","confirmed");
const program = createKeypairFromFile("./target/deploy/limit_order-keypair.json")

let token_mint_a;
let user_token_ata_a;
let mediator_vault_account;

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
const taker = Keypair.generate();

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

describe("Test_Limit_Order_Solana_Native_Program" , function (){

  const values = createValuesForInit()

    it("Airdrop", async () => {
      await Promise.all([order_book_admin_pubkey.publicKey,values.btc_order_book , user_creating_order.publicKey].map(async (k) => {
          return await connection.requestAirdrop(k, 5_000_000_000)
      })).then(confirmTxs);
      console.log("✅ Airdrop Done")
  });


    it("Init Program Manager", async () => {
     try {
       const ix = buildInit({
        btc_order_book : values.btc_order_book,
        fee_payer : order_book_admin_pubkey.publicKey,
        program_id : program_id,
       })
       const init_transaction_signature = await sendAndConfirmTransaction(connection , new Transaction().add(ix) , [order_book_admin_pubkey])
       console.log("✅ init_transaction_signature",init_transaction_signature) 
     } catch(error) {
      console.log("Error from init_ins",error)
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
  
      const sig = await connection.requestAirdrop(user_creating_order.publicKey, 5_000_000_000);
      await confirmTx(sig);
      
      const new_mint = await newMintToAta(connection, user_creating_order);
    
      const mediator_vault = getAssociatedTokenAddressSync(
        new_mint.mint,
        btc_order_book,
        true
      );

      token_mint_a = new_mint.mint;
      user_token_ata_a = new_mint.ata;
      mediator_vault_account = mediator_vault

      const ix = buildCreateOrder({
      side : "buy",
      amount: new BN(1 * 10 ** 6),
      price: new BN(1 * 10 ** 6),
       user : user_creating_order.publicKey,
       btc_order_book : btc_order_book,
       order_book_admin_pubkey : order_book_admin_pubkey.publicKey,
       token_mint : new_mint.mint,
       user_token_account : new_mint.ata,
       mediator_vault : mediator_vault,
       program_id : program_id,
      })
 
      const create_order_transaction_signature = await sendAndConfirmTransaction(connection , new Transaction().add(ix) , [user_creating_order])
      console.log("✅ create_order_transaction_signature", create_order_transaction_signature)

      write_into_file()

    } catch(error) {
     console.log("Error from create_order_ins",error)
    }
     
 })


 xit("Take Order", async () => {
  try {

    const btc_order_book = PublicKey.findProgramAddressSync(
      [
        Buffer.from('btc_order_book'),
        order_book_admin_pubkey.publicKey.toBuffer(),
      ],
      program_id
    )[0]; 

      const sig = await connection.requestAirdrop(user_creating_order.publicKey, 5_000_000_000);
      const sig_2 = await connection.requestAirdrop(taker.publicKey, 5_000_000_000);
      await confirmTx(sig);
      await confirmTx(sig_2);
     
    const new_mint_b = await newMintToAta(connection, taker);
    
    let user_ata_for_token_b = getAssociatedTokenAddressSync(
      new_mint_b.mint,
      user_creating_order.publicKey,
      true
    );

    let taker_ata_for_token_a = getAssociatedTokenAddressSync(
      token_mint_a,
      taker.publicKey,
      true
    )

    const ix = buildTakeOrder({
      amount : new BN(0.1 * 10 ** 2),
      price : new BN(0.1 * 10 ** 2),
      user : user_creating_order.publicKey,
      taker : taker.publicKey,
      btc_order_book : btc_order_book,
      order_book_admin_pubkey : order_book_admin_pubkey.publicKey,
      token_mint_a,
      token_mint_b : new_mint_b.mint,
      user_token_account_b : user_ata_for_token_b,
      taker_token_account_a : taker_ata_for_token_a,
      taker_token_account_b : new_mint_b.ata,
      mediator_vault : mediator_vault_account,
     program_id : program_id,
    })

    const take_order_transaction_instruction = await sendAndConfirmTransaction(connection , new Transaction().add(ix) , [taker])
    console.log("✅ take_order_transaction_instruction",take_order_transaction_instruction)

    //write_into_file()

  } catch(error) {
   console.log("Error form take_order ins", error)
  }
   
})


it("Cancel Order", async () => {
  try {

    const btc_order_book = PublicKey.findProgramAddressSync(
      [
        Buffer.from('btc_order_book'),
        order_book_admin_pubkey.publicKey.toBuffer(),
      ],
      program_id
    )[0]; 

      const sig = await connection.requestAirdrop(user_creating_order.publicKey, 5_000_000_000);
      const sig_2 = await connection.requestAirdrop(taker.publicKey, 5_000_000_000);
      await confirmTx(sig);
      await confirmTx(sig_2);
     
    const new_mint_b = await newMintToAta(connection, taker);

    const ix = buildCancelOrder({
      amount : new BN(1 * 10 ** 6),
      user : user_creating_order.publicKey,
      btc_order_book : btc_order_book,
      order_book_admin_pubkey : order_book_admin_pubkey.publicKey,
      token_mint_a,
      user_token_account_a : user_token_ata_a,
      mediator_vault : mediator_vault_account,
     program_id : program_id,
    })

    const cancel_order_transaction_signature = await sendAndConfirmTransaction(connection , new Transaction().add(ix) , [user_creating_order])
    console.log("✅ cancel_order_transaction_signature", cancel_order_transaction_signature)

    //write_into_file()

  } catch(error) {
   console.log(error)
  }
   
})

})