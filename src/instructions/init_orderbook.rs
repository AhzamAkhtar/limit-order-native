use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::{next_account_info, AccountInfo}, entrypoint::ProgramResult, msg, program::{invoke, invoke_signed}, program_error::ProgramError, pubkey::Pubkey, rent::Rent, system_instruction, sysvar::Sysvar};

use crate::{error::ApplicationError, state::OrderBook};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct InitOrder {}

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

        let order_book = OrderBook {
            authority : *fee_payer.key,
            bump
        };

        let size = borsh::to_vec::<OrderBook>(&order_book)?.len();
        let rent = (Rent::get()?).minimum_balance(size);
    
        invoke(
            &system_instruction::transfer(
                fee_payer.key,     
                btc_order_book.key, 
                rent,               
            ),
            &[fee_payer.clone(), btc_order_book.clone(), system_program.clone()],
        )?;
        
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
        order_book.serialize(&mut *btc_order_book.data.borrow_mut())?;

        Ok(())
    }
}