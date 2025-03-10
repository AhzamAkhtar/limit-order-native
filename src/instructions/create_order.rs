use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, msg, program::invoke, program_error::ProgramError, pubkey::Pubkey};
use spl_associated_token_account::instruction as associated_token_account_instruction;
use crate::{error::ApplicationError, state::{OrderBook, OrderBookData, OrderList}};
use spl_token::{instruction as token_instruction, state::Account as TokenAccount};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CreateOrder {
    pub side : String,
    pub amount : u64,
    pub price : u64,
}

impl CreateOrder {
    pub fn create_order(
        program_id : &Pubkey,
        accounts : &[AccountInfo<'_>],
        args : CreateOrder
    ) -> ProgramResult {

        let [
            user,
            btc_order_book,
            order_book_admin_pubkey,
            token_mint,
            user_token_account,
            mediator_vault,
            token_program_id,
            associated_token_program,
            system_program
        ] = accounts else {
            return Err(ProgramError::NotEnoughAccountKeys);
        };

        let btc_order_book_data = OrderBook::try_from_slice(&btc_order_book.data.borrow()[..])?;

        let btc_order_book_seed = &[
            b"btc_order_book",
            order_book_admin_pubkey.key.as_ref(),
            &[btc_order_book_data.bump]
        ];

        let order_book_key  = Pubkey::create_program_address(btc_order_book_seed, program_id)?;

        if order_book_key != *btc_order_book.key {
            return Err(ApplicationError::MismatchOrderbookKey.into());
        }

        // create user token_account for the given_token_account if needed
        if user_token_account.lamports() == 0 {
            invoke(
                &associated_token_account_instruction::create_associated_token_account(
                    user.key, 
                    user.key,
                     token_mint.key,
                      token_program_id.key
                    ),
                    &[
                        user.clone(),
                        token_mint.clone(),
                        token_program_id.clone(),
                        system_program.clone(),
                        associated_token_program.clone()
                    ]
                    
            )?;
        }

        //create mediator-vault token-account for holding the tokens
        invoke(
            &associated_token_account_instruction::create_associated_token_account(
                user.key,
                 btc_order_book.key,
                  token_mint.key,
                   token_program_id.key
            ),
            &[
                token_mint.clone(),
                mediator_vault.clone(),
                btc_order_book.clone(),
                user.clone(),
                system_program.clone(),
                token_program_id.clone(),
                associated_token_program.clone()
            ]
        )?;

        // transfer users funds to mediator vault
        invoke(
            &token_instruction::transfer(
                token_program_id.key,
                 user_token_account.key,
                  mediator_vault.key,
                   user.key,
                    &[user.key],
                     args.amount
                    )?,
            &[
                token_program_id.clone(),
                user_token_account.clone(),
                mediator_vault.clone(),
                user.clone()
            ]
        )?;

        Ok(())
    }
}