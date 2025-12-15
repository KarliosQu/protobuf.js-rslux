mod varint;
mod wire_type;
mod reader;
mod writer;

use napi_derive::napi;

/// Get the library version
#[napi]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// ZigZag encode a 32-bit signed integer
#[napi]
pub fn zigzag_encode32(value: i32) -> u32 {
    varint::zigzag_encode32(value)
}

/// ZigZag decode a 32-bit unsigned integer
#[napi]
pub fn zigzag_decode32(value: u32) -> i32 {
    varint::zigzag_decode32(value)
}

/// ZigZag encode a 64-bit signed integer
#[napi]
pub fn zigzag_encode64(value: i64) -> String {
    // Return as string since JavaScript can't handle full i64
    varint::zigzag_encode64(value).to_string()
}

/// ZigZag decode a 64-bit unsigned integer
#[napi]
pub fn zigzag_decode64(value: i64) -> i64 {
    varint::zigzag_decode64(value as u64)
}

/// Encode a field tag
#[napi]
pub fn encode_tag(field_number: u32, wire_type: u32) -> Result<u32, napi::Error> {
    let wt = wire_type::WireType::from_u8(wire_type as u8)
        .ok_or_else(|| napi::Error::from_reason("Invalid wire type"))?;
    Ok(wire_type::encode_tag(field_number, wt))
}

/// Decode a field tag
#[napi]
pub fn decode_tag(tag: u32) -> (u32, u32) {
    let (field_number, wire_type) = wire_type::decode_tag(tag);
    (field_number, wire_type.map(|wt| wt as u32).unwrap_or(255))
}

// Wire type constants
#[napi]
pub const WIRE_TYPE_VARINT: u32 = 0;

#[napi]
pub const WIRE_TYPE_FIXED64: u32 = 1;

#[napi]
pub const WIRE_TYPE_LENGTH_DELIMITED: u32 = 2;

#[napi]
pub const WIRE_TYPE_START_GROUP: u32 = 3;

#[napi]
pub const WIRE_TYPE_END_GROUP: u32 = 4;

#[napi]
pub const WIRE_TYPE_FIXED32: u32 = 5;
