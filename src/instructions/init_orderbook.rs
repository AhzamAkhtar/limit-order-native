use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

use crate::{error::ApplicationError, state::Manager};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct InitOrder {}

impl InitOrder {
    
    pub fn init_orderbook(
        program_id: &Pubkey,
        accounts: &[AccountInfo]
        ) -> ProgramResult {

        let [
            manager, // manager config_account
            fee_payer, // fee_payer for init process
            system_program
            ] = accounts else {
            return Err(ProgramError::NotEnoughAccountKeys);
        };

        let manager_account_seeds = &[b"btc_order_book", fee_payer.key.as_ref()];

        let (manager_account, bump) =
            Pubkey::find_program_address(manager_account_seeds, program_id);

        if *manager.key != manager_account {
            return Err(ApplicationError::MismatchOrderbookKey.into());
        }

        let order_book = Manager {
            authority: *fee_payer.key,
            bump,
        };

        let size = borsh::to_vec::<Manager>(&order_book)?.len();
        let rent = (Rent::get()?).minimum_balance(size);

        // transfer lamports for paying the rent
        invoke(
            &system_instruction::transfer(fee_payer.key, manager.key, rent),
            &[
                fee_payer.clone(),
                manager.clone(),
                system_program.clone(),
            ],
        )?;

        //allocate space for the account
        invoke_signed(
            &system_instruction::allocate(manager.key, size as u64),
            &[manager.clone(), system_program.clone()],
            &[&[b"btc_order_book", fee_payer.key.as_ref(), &[bump]]],
        )?;

        // assign the pda to program
        invoke_signed(
            &system_instruction::assign(manager.key, program_id),
            &[manager.clone(), system_program.clone()],
            &[&[b"btc_order_book", fee_payer.key.as_ref(), &[bump]]],
        )?;

        //write data into btc_order_book account
        order_book.serialize(&mut *manager.data.borrow_mut())?;

        Ok(())
    }
}
