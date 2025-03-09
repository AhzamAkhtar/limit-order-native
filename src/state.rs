use std::{fs::{self, File, OpenOptions}, io::{Read, Write}};
use bincode;
use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
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
    pub authority : Pubkey,
    pub bump : u8
}

#[derive(Serialize,Deserialize,Debug,Default)]
pub struct OrderBookData {
    pub orders : Vec<OrderList>
}

#[derive(Serialize,Deserialize,Debug,Clone)]
pub struct OrderList {
    pub side : String,
    pub amount : u64,
    pub price : u64,
    //pub is_expiry : bool,
    //pub time_of_order_creation : u64,
    //pub order_expiry_time : Option<u64>don
}

impl OrderBookData {
 /// Adds a new account while preserving existing data
 pub fn add_new_account(&mut self, order: OrderList) {
    let file_path = format!("orderbook/orderbook.txt");

    // Try to open the file, if it exists, read existing accounts
    let mut accounts = self.read_accounts_from_file(&file_path);

    // Append the new account
    accounts.push(order.clone());

    // Serialize updated accounts list
    let serialized_data = bincode::serialize(&accounts).expect("Serialization failed");

    // Open file for writing (truncate to update it)
    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true) // Ensures old data is replaced
        .open(&file_path)
        .expect("Failed to open file");

    file.write_all(&serialized_data).expect("Write failed");
}

 /// Reads all stored accounts from the file
 pub fn read_accounts_from_file(&self, file_path: &str) -> Vec<OrderList> {
    if let Ok(mut file) = File::open(file_path) {
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).expect("Failed to read file");

        bincode::deserialize(&buffer).unwrap_or_else(|_| Vec::new()) // Handle empty/corrupt files
    } else {
        Vec::new() // Return empty list if file does not exist
    }
}

}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    const TEST_FILE_PATH: &str = "orderbook/orderbook.txt";

    #[test]
    fn test_add_new_order_and_read() {
        let mut order_book = OrderBookData::default();

        let order1 = OrderList {
            side: "buy".to_string(),
            amount: 1000,
            price: 500,
        };

        let order2 = OrderList {
            side: "sell".to_string(),
            amount: 2000,
            price: 600,
        };

        // Add orders
        order_book.add_new_account( order1.clone());
        order_book.add_new_account( order2.clone());

        // Read back the orders
        let stored_orders = order_book.read_accounts_from_file(TEST_FILE_PATH);

        // assert_eq!(stored_orders.len(), 2);
    }

   
   
}

