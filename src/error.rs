use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Debug,Error)]
pub enum ApplicationError {
    #[error("OrderBook Key Mismatch")]
    MismatchOrderbookKey
}

impl From<ApplicationError> for ProgramError {
    fn from(value: ApplicationError) -> Self {
        ProgramError::Custom(value as u32)
    }
}

