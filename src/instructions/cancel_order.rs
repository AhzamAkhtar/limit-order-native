use crate::{error::ApplicationError, state::Manager};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, program::invoke_signed,
    program_error::ProgramError, pubkey::Pubkey,
};
use spl_associated_token_account::instruction as associated_token_account_instruction;
use spl_token::{instruction as token_instruction, state::Account as TokenAccount};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CancelOrder {
    id : u64,
    amount: u64,
}

impl CancelOrder {
    pub fn cancel_order(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        args: CancelOrder,
    ) -> ProgramResult {
        
        let [
            user, // user that's create the order
            manager, //manager config_account
            manager_auth, // manager auth
            token_mint_a, // token_mint that user want to trade for
            user_token_account_a, // user token_account for mint_a
            mediator_vault, // vault where user token are stored
            token_program_id,
            associated_token_program,
            system_program
        ] =
            accounts
        else {
            return Err(ProgramError::NotEnoughAccountKeys);
        };

        let manager_account_data = Manager::try_from_slice(&manager.data.borrow()[..])?;

        let manager_account_seeds = &[
            b"btc_order_book",
            manager_auth.key.as_ref(),
            &[manager_account_data.bump],
        ];

        let order_book_key = Pubkey::create_program_address(manager_account_seeds, program_id)?;

        if order_book_key != *manager.key {
            return Err(ApplicationError::MismatchOrderbookKey.into());
        }

        // send user back its fund from mediator_vault
        invoke_signed(
            &token_instruction::transfer(
                token_program_id.key,
                mediator_vault.key,
                user_token_account_a.key,
                manager.key,
                &[],
                args.amount,
            )?,
            &[
                user.clone(),
                token_mint_a.clone(),
                mediator_vault.clone(),
                user_token_account_a.clone(),
                manager_auth.clone(),
                manager.clone(),
                token_program_id.clone(),
            ],
            &[manager_account_seeds],
        )?;

        Ok(())
    }
}
