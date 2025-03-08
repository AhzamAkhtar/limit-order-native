use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, program::invoke, program_error::ProgramError, pubkey::Pubkey};
use spl_associated_token_account::instruction as associated_token_account_instruction;
use crate::{error::ApplicationError, state::{OrderBook, OrderList}};
use spl_token::{instruction as token_instruction, state::Account as TokenAccount};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CreateOrder {
    pub side : String,
    pub amount_token_for_trade : u64,
    pub price : u64,
    pub is_expiry : bool,
}

impl CreateOrder {
    pub fn create_order(
        program_id : &Pubkey,
        accounts : &[AccountInfo<'_>],
        args : CreateOrder
    ) -> ProgramResult {

        let [
            btc_order_book,
            order_book_admin_pubkey,
            user,
            token_mint,
            user_token_account,
            mediator_vault,
            token_program_id,
            associated_token_program,
            system_program
        ] = accounts else {
            return Err(ProgramError::NotEnoughAccountKeys);
        };

        let mut btc_order_book_data = OrderBook::try_from_slice(&btc_order_book.data.borrow()[..])?;

        let btc_order_book_seed = &[
            b"btc_order_book",
            order_book_admin_pubkey.key.as_ref(),
            &[btc_order_book_data.bump]
        ];

        let order_book_key  = Pubkey::create_program_address(btc_order_book_seed, program_id)?;

        if order_book_key != *btc_order_book.key {
            return Err(ApplicationError::MismatchOrderbookKey.into());
        }

        // create user token_account for the given_token_account
        if user_token_account.lamports() == 0 {
            invoke(
                &associated_token_account_instruction::create_associated_token_account_idempotent(
                    user.key, 
                    user.key,
                     token_mint.key,
                      token_program_id.key
                    ),
                    // &[
                    //     user.clone(),
                    //     token_mint.clone(),
                    //     token_program_id.clone(),
                    //     system_program.clone(),
                    //     associated_token_program.clone()
                    // ]
                    accounts
            )?;
        }


        //create mediator vault for holding the tokens
        invoke(
            &associated_token_account_instruction::create_associated_token_account(
                user.key,
                 mediator_vault.key,
                  token_mint.key,
                   token_program_id.key
            ),
            accounts
        )?;

        // transfer users funds to mediator vault
        invoke(
            &token_instruction::transfer(
                token_program_id.key,
                 user.key,
                  mediator_vault.key,
                   user.key,
                    &[user.key],
                     args.amount_token_for_trade
                    )?,
            accounts
        )?;


        // update the order_book
        let new_order = OrderList {
            side : args.side,
            amount_token_for_trade : args.amount_token_for_trade,
            is_expiry : args.is_expiry,
            price : args.price,
        };

        btc_order_book_data.orders.push(new_order);

        //order_book.serialize(&mut &mut order_book_account.data.borrow_mut()[..])?;
        btc_order_book_data.serialize(&mut btc_order_book.data.borrow_mut().as_mut())?;

        Ok(())
    }
}