use borsh::BorshSerialize;
use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, program::invoke_signed, program_error::ProgramError, pubkey::Pubkey, rent::Rent, system_instruction, sysvar::Sysvar};

use crate::{error::ApplicationError, state::OrderBook};

impl OrderBook {
    pub fn init_orderbook(
        program_id : &Pubkey,
        accounts : &[AccountInfo<'_>]
    ) -> ProgramResult {

        let [
            btc_order_book,
            order_book_admin_pubkey,
            payer,
            system_program
        ] = accounts else {
            return Err(ProgramError::NotEnoughAccountKeys);
        };

        let btc_order_book_seeds = &[
            b"btc_order_book",
            order_book_admin_pubkey.key.as_ref()
        ];

        let (btc_order_book_key , bump) = Pubkey::find_program_address(btc_order_book_seeds, program_id);

        if *btc_order_book.key != btc_order_book_key {
           return Err(ApplicationError::MismatchOrderbookKey.into());
        }

        let order_book = OrderBook {
            orders : Vec::new(),
            authority : *order_book_admin_pubkey.key,
            bump
        };

        let size = borsh::to_vec::<OrderBook>(&order_book)?.len();
        let rent = (Rent::get()?).minimum_balance(size);

        // create account

        invoke_signed(
            &system_instruction::create_account(
                payer.key,
                 btc_order_book.key,
                  rent,
                   size as u64,
                    program_id
            ),
            &[payer.clone(),btc_order_book.clone(),order_book_admin_pubkey.clone(),system_program.clone()],
            &[&[
                b"btc_order_book",
                order_book_admin_pubkey.key.as_ref(),
                &[bump]
            ]]
        )?;

        //write data into btc_order_book account

        order_book.serialize(&mut *btc_order_book.data.borrow_mut())?;

        Ok(())
    }
}