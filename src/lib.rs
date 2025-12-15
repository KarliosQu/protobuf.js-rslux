mod varint;
mod wire_type;
mod reader;
mod writer;

use napi::bindgen_prelude::*;
use napi_derive::napi;

// Re-export Writer and Reader
pub use writer::Writer;
pub use reader::Reader;

/// Encode a varint value to a Buffer
#[napi]
pub fn encode_varint(value: i64) -> Result<Buffer> {
    let bytes = if value >= 0 && value <= u32::MAX as i64 {
        varint::encode_varint32(value as u32)
    } else {
        varint::encode_varint64(value as u64)
    };
    Ok(Buffer::from(bytes))
}

/// Decode a varint from a buffer at the given position
/// Returns an object with { value, length }
#[napi(object)]
pub struct VarintResult {
    pub value: i64,
    pub length: u32,
}

#[napi]
pub fn decode_varint(buffer: Buffer, pos: u32) -> Result<VarintResult> {
    let buf = buffer.as_ref();
    let mut offset = pos as usize;
    let start_offset = offset;
    
    let value = varint::decode_varint64(buf, &mut offset)
        .map_err(|e| Error::from_reason(e))?;
    
    let length = (offset - start_offset) as u32;
    
    Ok(VarintResult {
        value: value as i64,
        length,
    })
}
