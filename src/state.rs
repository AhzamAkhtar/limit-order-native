use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;
/// BTC-USD OrderBook
// BTC-USD [
//      Buy : [
//         {amount_token = 100,
//         price = 34
//         order_expiry = Option<u64>},
//         {amount_token = 100
//         price = 34
//         order_expiry = Option<u64>}
//     ],
//     Sell : [
//         {
//         amount_token = 100,
//         price = 34
//         order_expiry = Option<u64>
//     },
//        { amount_token = 100,
//         price = 34
//         order_expiry = Option<u64>}
//     ]
// ]



#[derive(BorshDeserialize,BorshSerialize,Debug)]
pub struct OrderBook {
    pub orders : Vec<OrderList>,
    pub authority : Pubkey,
    pub bump : u8
}

#[derive(BorshDeserialize,BorshSerialize,Debug,Clone)]
pub struct OrderList {
    pub side : String,
    pub amount : u64,
    pub price : u64,
    //pub is_expiry : bool,
    //pub time_of_order_creation : u64,
    //pub order_expiry_time : Option<u64>don
}

// #[derive(BorshDeserialize,BorshSerialize)]
// pub enum Side {
//     Buy,
//     Sell
// }