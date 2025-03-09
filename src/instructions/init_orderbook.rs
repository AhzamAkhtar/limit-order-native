use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::{next_account_info, AccountInfo}, entrypoint::ProgramResult, msg, program::{invoke, invoke_signed}, program_error::ProgramError, pubkey::Pubkey, rent::Rent, system_instruction, sysvar::Sysvar};

use crate::{error::ApplicationError, state::OrderBook};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct InitOrder {
}

impl InitOrder {
    pub fn init_orderbook(
        program_id : &Pubkey,
        accounts : &[AccountInfo],
    ) -> ProgramResult {

        let [
            btc_order_book,
            fee_payer,
            system_program,
        ] = accounts else {
            return Err(ProgramError::NotEnoughAccountKeys);
        };

        let btc_order_book_seeds = &[
            b"btc_order_book",
            fee_payer.key.as_ref(),
        ];

        let (btc_order_book_key , bump) = Pubkey::find_program_address(btc_order_book_seeds, program_id);

        if *btc_order_book.key != btc_order_book_key {
           return Err(ApplicationError::MismatchOrderbookKey.into());
        }

        println!("key_sol {:?}",btc_order_book_key);

        let order_book = OrderBook {
            orders : Vec::new(),
            authority : *fee_payer.key,
            bump
        };

        let size = borsh::to_vec::<OrderBook>(&order_book)?.len();
        let rent = (Rent::get()?).minimum_balance(size);

        // create account

        invoke(
            &system_instruction::transfer(
                fee_payer.key,      // From
                btc_order_book.key, // To (PDA)
                rent,               // Amount (rent exemption)
            ),
            &[fee_payer.clone(), btc_order_book.clone(), system_program.clone()],
        )?;
        
        // Then, allocate space for the account
        invoke_signed(
            &system_instruction::allocate(
                btc_order_book.key,
                size as u64,
            ),
            &[btc_order_book.clone(), system_program.clone()],
            &[&[
                b"btc_order_book",
                fee_payer.key.as_ref(),
                &[bump]
            ]],
        )?;
        
        // Finally, assign the PDA to your program
        invoke_signed(
            &system_instruction::assign(
                btc_order_book.key,
                program_id,
            ),
            &[btc_order_book.clone(), system_program.clone()],
            &[&[
                b"btc_order_book",
                fee_payer.key.as_ref(),
                &[bump]
            ]],
        )?;

        //write data into btc_order_book account
        //msg!("Writing data to PDA...");
        order_book.serialize(&mut *btc_order_book.data.borrow_mut())?;

        Ok(())
    }
}