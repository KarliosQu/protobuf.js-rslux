use crate::varint::{encode_varint32, encode_varint64, zigzag_encode32, zigzag_encode64};
use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Binary writer for Protocol Buffer messages with fluent API
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
            buffer: Vec::with_capacity(256), // Pre-allocate for better performance
            stack: Vec::new(),
        }
    }

    /// Write uint32 (varint encoded)
    #[napi]
    pub fn uint32(&mut self, value: u32) -> &Self {
        self.buffer.extend_from_slice(&encode_varint32(value));
        self
    }

    /// Write int32 (varint encoded)
    #[napi]
    pub fn int32(&mut self, value: i32) -> &Self {
        // Sign-extend to 64-bit for proper varint encoding of negative numbers
        let extended = value as i64;
        self.buffer.extend_from_slice(&encode_varint64(extended as u64));
        self
    }

    /// Write sint32 (zigzag + varint encoded)
    #[napi]
    pub fn sint32(&mut self, value: i32) -> &Self {
        let encoded = zigzag_encode32(value);
        self.buffer.extend_from_slice(&encode_varint32(encoded));
        self
    }

    /// Write uint64 (varint encoded)
    #[napi]
    pub fn uint64(&mut self, value: i64) -> &Self {
        self.buffer.extend_from_slice(&encode_varint64(value as u64));
        self
    }

    /// Write int64 (varint encoded)
    #[napi]
    pub fn int64(&mut self, value: i64) -> &Self {
        self.buffer.extend_from_slice(&encode_varint64(value as u64));
        self
    }

    /// Write sint64 (zigzag + varint encoded)
    #[napi]
    pub fn sint64(&mut self, value: i64) -> &Self {
        let encoded = zigzag_encode64(value);
        self.buffer.extend_from_slice(&encode_varint64(encoded));
        self
    }

    /// Write bool (varint encoded as 0 or 1)
    #[napi]
    pub fn bool(&mut self, value: bool) -> &Self {
        self.buffer.push(if value { 1 } else { 0 });
        self
    }

    /// Write fixed32 (little-endian 4 bytes)
    #[napi]
    pub fn fixed32(&mut self, value: u32) -> &Self {
        self.buffer.extend_from_slice(&value.to_le_bytes());
        self
    }

    /// Write sfixed32 (little-endian 4 bytes)
    #[napi]
    pub fn sfixed32(&mut self, value: i32) -> &Self {
        self.buffer.extend_from_slice(&value.to_le_bytes());
        self
    }

    /// Write fixed64 (little-endian 8 bytes)
    #[napi]
    pub fn fixed64(&mut self, value: i64) -> &Self {
        self.buffer.extend_from_slice(&(value as u64).to_le_bytes());
        self
    }

    /// Write sfixed64 (little-endian 8 bytes)
    #[napi]
    pub fn sfixed64(&mut self, value: i64) -> &Self {
        self.buffer.extend_from_slice(&value.to_le_bytes());
        self
    }

    /// Write float (32-bit, little-endian)
    #[napi]
    pub fn float(&mut self, value: f64) -> &Self {
        let f32_value = value as f32;
        self.buffer.extend_from_slice(&f32_value.to_le_bytes());
        self
    }

    /// Write double (64-bit, little-endian)
    #[napi]
    pub fn double(&mut self, value: f64) -> &Self {
        self.buffer.extend_from_slice(&value.to_le_bytes());
        self
    }

    /// Write bytes (length-delimited)
    #[napi]
    pub fn bytes(&mut self, value: Buffer) -> &Self {
        let bytes = value.as_ref();
        self.buffer.extend_from_slice(&encode_varint32(bytes.len() as u32));
        self.buffer.extend_from_slice(bytes);
        self
    }

    /// Write string (UTF-8, length-delimited)
    #[napi]
    pub fn string(&mut self, value: String) -> &Self {
        let bytes = value.as_bytes();
        self.buffer.extend_from_slice(&encode_varint32(bytes.len() as u32));
        self.buffer.extend_from_slice(bytes);
        self
    }

    /// Fork the writer for nested messages
    /// Returns the position for later length calculation
    #[napi]
    pub fn fork(&mut self) -> u32 {
        let head = self.buffer.len();
        // Reserve space for length prefix (max 5 bytes for varint32)
        self.buffer.extend_from_slice(&[0, 0, 0, 0, 0]);
        self.stack.push((head, self.buffer.len()));
        self.buffer.len() as u32
    }

    /// Write length delimiter after fork
    /// Calculates the length of the nested message and updates the length prefix
    #[napi]
    pub fn ldelim(&mut self) -> Result<&Self> {
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
        
        Ok(self)
    }

    /// Finish writing and return the buffer
    #[napi]
    pub fn finish(&mut self) -> Buffer {
        Buffer::from(self.buffer.clone())
    }

    /// Reset the writer to reuse it
    #[napi]
    pub fn reset(&mut self) -> &Self {
        self.buffer.clear();
        self.stack.clear();
        self
    }
}
