use crate::varint::{encode_varint32, encode_varint64, zigzag_encode32, zigzag_encode64};
use crate::wire_type::{encode_tag, WireType};
use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Binary writer for Protocol Buffer messages
#[napi]
pub struct Writer {
    buffer: Vec<u8>,
    stack: Vec<(usize, usize)>, // Stack for fork/ldelim: (fork_pos, head_pos)
}

#[napi]
impl Writer {
    /// Create a new Writer
    #[napi(constructor)]
    pub fn new() -> Self {
        Writer {
            buffer: Vec::new(),
            stack: Vec::new(),
        }
    }

    /// Get current buffer length
    #[napi]
    pub fn len(&self) -> u32 {
        self.buffer.len() as u32
    }

    /// Write a tag (field number and wire type)
    #[napi]
    pub fn write_tag(&mut self, field_number: u32, wire_type: u32) -> Result<()> {
        let wt = WireType::from_u8(wire_type as u8)
            .ok_or_else(|| Error::from_reason("Invalid wire type"))?;
        let tag = encode_tag(field_number, wt);
        self.buffer.extend_from_slice(&encode_varint32(tag));
        Ok(())
    }

    /// Write a varint (u32)
    #[napi]
    pub fn write_varint32(&mut self, value: u32) {
        self.buffer.extend_from_slice(&encode_varint32(value));
    }

    /// Write a varint (u64/i64)
    #[napi]
    pub fn write_varint64(&mut self, value: i64) {
        self.buffer.extend_from_slice(&encode_varint64(value as u64));
    }

    /// Write a signed varint (zigzag encoded i32)
    #[napi]
    pub fn write_sint32(&mut self, value: i32) {
        let encoded = zigzag_encode32(value);
        self.buffer.extend_from_slice(&encode_varint32(encoded));
    }

    /// Write a signed varint (zigzag encoded i64)
    #[napi]
    pub fn write_sint64(&mut self, value: i64) {
        let encoded = zigzag_encode64(value);
        self.buffer.extend_from_slice(&encode_varint64(encoded));
    }

    /// Write fixed32
    #[napi]
    pub fn write_fixed32(&mut self, value: u32) {
        self.buffer.extend_from_slice(&value.to_le_bytes());
    }

    /// Write fixed64
    #[napi]
    pub fn write_fixed64(&mut self, value: i64) {
        self.buffer.extend_from_slice(&(value as u64).to_le_bytes());
    }

    /// Write sfixed32
    #[napi]
    pub fn write_sfixed32(&mut self, value: i32) {
        self.buffer.extend_from_slice(&value.to_le_bytes());
    }

    /// Write sfixed64
    #[napi]
    pub fn write_sfixed64(&mut self, value: i64) {
        self.buffer.extend_from_slice(&value.to_le_bytes());
    }

    /// Write float (32-bit)
    #[napi]
    pub fn write_float(&mut self, value: f64) {
        let bits = (value as f32).to_bits();
        self.buffer.extend_from_slice(&bits.to_le_bytes());
    }

    /// Write double (64-bit)
    #[napi]
    pub fn write_double(&mut self, value: f64) {
        self.buffer.extend_from_slice(&value.to_le_bytes());
    }

    /// Write boolean
    #[napi]
    pub fn write_bool(&mut self, value: bool) {
        self.buffer.push(if value { 1 } else { 0 });
    }

    /// Write string (UTF-8 encoded)
    #[napi]
    pub fn write_string(&mut self, value: String) {
        let bytes = value.as_bytes();
        self.buffer.extend_from_slice(&encode_varint32(bytes.len() as u32));
        self.buffer.extend_from_slice(bytes);
    }

    /// Write bytes
    #[napi]
    pub fn write_bytes(&mut self, value: Buffer) {
        let bytes = value.as_ref();
        self.buffer.extend_from_slice(&encode_varint32(bytes.len() as u32));
        self.buffer.extend_from_slice(bytes);
    }

    /// Fork the writer (for nested messages)
    /// Returns the current position for later length calculation
    #[napi]
    pub fn fork(&mut self) -> u32 {
        let head = self.buffer.len();
        // Reserve space for length prefix (max 5 bytes for varint32)
        self.buffer.extend_from_slice(&[0, 0, 0, 0, 0]);
        self.stack.push((head, self.buffer.len()));
        self.buffer.len() as u32
    }

    /// Write length delimiter (after fork)
    /// Calculates the length of the nested message and updates the length prefix
    #[napi]
    pub fn ldelim(&mut self) -> Result<()> {
        if self.stack.is_empty() {
            return Err(Error::from_reason("No fork to delimit"));
        }
        
        let (fork_pos, head_pos) = self.stack.pop().unwrap();
        let len = self.buffer.len() - head_pos;
        
        // Encode the length
        let len_bytes = encode_varint32(len as u32);
        let len_encoded_len = len_bytes.len();
        
        // We reserved 5 bytes, but we might need fewer
        // Remove unused reserved bytes
        let unused = 5 - len_encoded_len;
        if unused > 0 {
            self.buffer.drain(fork_pos + len_encoded_len..fork_pos + 5);
        }
        
        // Copy the encoded length to the reserved space
        for (i, &byte) in len_bytes.iter().enumerate() {
            self.buffer[fork_pos + i] = byte;
        }
        
        Ok(())
    }

    /// Finish writing and return the buffer
    #[napi]
    pub fn finish(&self) -> Buffer {
        Buffer::from(self.buffer.clone())
    }

    /// Reset the writer
    #[napi]
    pub fn reset(&mut self) {
        self.buffer.clear();
        self.stack.clear();
    }
}
