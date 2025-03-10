use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
use solana_program::pubkey::Pubkey;

// OrderBook act as a manager that stores information to control the vaults for smooth trade experience
#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct OrderBook {
    pub authority: Pubkey,
    pub bump: u8,
}

// OrderBookData is a off-chain order-book that store all trades information
#[derive(Serialize, Deserialize, Debug, Default)]
pub struct OrderBookData {
    pub orders: Vec<OrderList>,
}

// OrderList describes each order that the user is making
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OrderList {
    pub side: String,
    pub amount: u64,
    pub price: u64,
}
