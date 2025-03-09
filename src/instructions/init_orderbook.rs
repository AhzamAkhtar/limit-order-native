use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::{next_account_info, AccountInfo}, entrypoint::ProgramResult, program::{invoke, invoke_signed}, program_error::ProgramError, pubkey::Pubkey, rent::Rent, system_instruction, sysvar::Sysvar};

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
            token_program,
            associated_token_program,
            rent
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
            orders : Vec::new(),
            authority : *fee_payer.key,
            bump
        };

        let size = borsh::to_vec::<OrderBook>(&order_book)?.len();
        let rent = (Rent::get()?).minimum_balance(size);

        // create account

        invoke_signed(
            &system_instruction::create_account(
                fee_payer.key,
                 btc_order_book.key,
                  rent,
                   size as u64,
                    system_program.key
            ),
            &[fee_payer.clone(),btc_order_book.clone(),system_program.clone()],
            // accounts,
            &[&[
                b"btc_order_book",
                fee_payer.key.as_ref(),
                &[bump]
            ]]
        )?;

        //write data into btc_order_book account

        order_book.serialize(&mut *btc_order_book.data.borrow_mut())?;

        Ok(())
    }
}