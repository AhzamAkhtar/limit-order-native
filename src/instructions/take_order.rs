use std::{io::Take, marker};

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, program::{invoke, invoke_signed}, program_error::ProgramError, pubkey::Pubkey};
use spl_associated_token_account::instruction as associated_token_account_instruction;
use spl_token::{instruction as token_instruction, state::Account as TokenAccount};
use crate::{error::ApplicationError, state::OrderBook};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct TakeOrder {
    amount : u64,
    price : u64
}

impl TakeOrder {
    pub fn take_order(
        program_id : &Pubkey,
        accounts : &[AccountInfo],
        args : TakeOrder
    ) -> ProgramResult {

        let [
            user,
            taker,
            btc_order_book,
            order_book_admin_pubkey,
            token_mint_a,
            token_mint_b,
            user_token_account_b,
            taker_token_account_a,
            taker_token_account_b,
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

        // create taker token_account for mint_a
        if taker_token_account_a.lamports() == 0 {
            invoke(
                &associated_token_account_instruction::create_associated_token_account
                (
                    taker.key,
                     taker.key,
                      token_mint_a.key,
                       token_program_id.key
                    ),
                    &[
                        taker_token_account_a.clone(),
                        taker.clone(),
                        token_mint_a.clone(),
                        system_program.clone(),
                        token_program_id.clone(),
                        associated_token_program.clone()
                    ]
            )?;
        }


        // create user/maker token_account for mint_b

        if user_token_account_b.lamports() == 0  {
            invoke(
                &associated_token_account_instruction::create_associated_token_account
                (
                    taker.key,
                     user.key,
                      token_mint_b.key,
                       token_program_id.key
                    ),
                    &[
                        token_mint_b.clone(),
                        taker.clone(),
                        user_token_account_b.clone(),
                        user.clone(),
                        system_program.clone(),
                        token_program_id.clone(),
                        associated_token_program.clone()
                    ]
            )?;
        }

        //transfer token from taker to maker

        invoke(
            &token_instruction::transfer(
                token_program_id.key,
                 taker_token_account_b.key,
                  user_token_account_b.key,
                   taker.key,
                    &[taker.key],
                     args.amount * args.price
                    )?,
                    &[
                        taker.clone(),
                        taker_token_account_b.clone(),
                        user_token_account_b.clone(),
                        token_program_id.clone()
                    ]
        )?;


        //transfer token from vault to taker

        invoke_signed(
            &token_instruction::transfer(
                token_program_id.key,
                 mediator_vault.key,
                  taker_token_account_a.key,
                   btc_order_book.key,
                    &[],
                     1
                    )?,
                    &[
                        token_mint_a.clone(),
                        mediator_vault.clone(),
                        taker_token_account_a.clone(),
                        order_book_admin_pubkey.clone(),
                        btc_order_book.clone(),
                        taker.clone(),
                        token_program_id.clone()
                    ],
                    &[
                        btc_order_book_seed
                    ]
        )?;

        //close the vault

        Ok(())
    }
}

