use borsh::{BorshDeserialize, BorshSerialize};
use instructions::{CreateOrder, InitOrder};
use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};
use state::OrderBook;

pub mod state;
pub mod instructions;
pub mod error;


fn process_instruction(
    program_id : &Pubkey,
    accounts : &[AccountInfo],
    instruction_data : &[u8]
) -> ProgramResult {

    let instrcution = LimitOrderInstruction::try_from_slice(instruction_data)?;

    match instrcution {
        LimitOrderInstruction::Init => InitOrder::init_orderbook(program_id, accounts),
        LimitOrderInstruction::CreateOrder(data) => CreateOrder::create_order(program_id, accounts ,data),
    }

}


#[derive(BorshSerialize, BorshDeserialize, Debug)]
enum LimitOrderInstruction {
    Init,
    CreateOrder(CreateOrder)
}