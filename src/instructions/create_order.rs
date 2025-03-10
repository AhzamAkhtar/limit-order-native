use crate::{
    error::ApplicationError,
    state::{Manager, OrderBookData, OrderList},
};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, msg, program::invoke,
    program_error::ProgramError, pubkey::Pubkey,
};
use spl_associated_token_account::instruction as associated_token_account_instruction;
use spl_token::{instruction as token_instruction, state::Account as TokenAccount};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CreateOrder {
    id : u64,
    side: String,
    amount: u64,
    price: u64,
}

impl CreateOrder {
    pub fn create_order(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        args: CreateOrder,
    ) -> ProgramResult {

        let [
            user, // user that's create the order
            manager, //manager config_account
            manager_auth, // manager auth
            token_mint, // token_mint that user want to trade for
            user_token_account, // user token_account for token_mint
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

        // create user token_account for the token_mint if needed
        if user_token_account.lamports() == 0 {
            invoke(
                &associated_token_account_instruction::create_associated_token_account(
                    user.key,
                    user.key,
                    token_mint.key,
                    token_program_id.key,
                ),
                &[
                    user.clone(),
                    token_mint.clone(),
                    token_program_id.clone(),
                    system_program.clone(),
                    associated_token_program.clone(),
                ],
            )?;
        }

        //create mediator-vault token-account for holding the tokens
        invoke(
            &associated_token_account_instruction::create_associated_token_account(
                user.key,
                manager.key,
                token_mint.key,
                token_program_id.key,
            ),
            &[
                token_mint.clone(),
                mediator_vault.clone(),
                manager.clone(),
                user.clone(),
                system_program.clone(),
                token_program_id.clone(),
                associated_token_program.clone(),
            ],
        )?;

        // transfer users funds to mediator_vault
        invoke(
            &token_instruction::transfer(
                token_program_id.key,
                user_token_account.key,
                mediator_vault.key,
                user.key,
                &[user.key],
                args.amount,
            )?,
            &[
                token_program_id.clone(),
                user_token_account.clone(),
                mediator_vault.clone(),
                user.clone(),
            ],
        )?;

        Ok(())
    }
}
