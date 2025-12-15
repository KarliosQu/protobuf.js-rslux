use crate::varint::{decode_varint32, decode_varint64, zigzag_decode32, zigzag_decode64};
use crate::wire_type::WireType;
use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Binary reader for Protocol Buffer messages
#[napi]
pub struct Reader {
    buffer: Vec<u8>,
    pos: usize,
}

#[napi]
impl Reader {
    /// Create a new Reader from a Buffer or Uint8Array
    #[napi(constructor)]
    pub fn new(buffer: Buffer) -> Self {
        Reader {
            buffer: buffer.to_vec(),
            pos: 0,
        }
    }

    /// Read uint32 (varint decoded)
    #[napi]
    pub fn uint32(&mut self) -> Result<u32> {
        decode_varint32(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))
    }

    /// Read int32 (varint decoded)
    #[napi]
    pub fn int32(&mut self) -> Result<i32> {
        // For negative numbers, this will be encoded as 10 bytes
        let val = decode_varint64(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))?;
        Ok(val as i32)
    }

    /// Read sint32 (zigzag decoded)
    #[napi]
    pub fn sint32(&mut self) -> Result<i32> {
        let val = decode_varint32(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))?;
        Ok(zigzag_decode32(val))
    }

    /// Read uint64 (varint decoded)
    #[napi]
    pub fn uint64(&mut self) -> Result<i64> {
        let val = decode_varint64(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))?;
        Ok(val as i64)
    }

    /// Read int64 (varint decoded)
    #[napi]
    pub fn int64(&mut self) -> Result<i64> {
        let val = decode_varint64(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))?;
        Ok(val as i64)
    }

    /// Read sint64 (zigzag decoded)
    #[napi]
    pub fn sint64(&mut self) -> Result<i64> {
        let val = decode_varint64(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))?;
        Ok(zigzag_decode64(val))
    }

    /// Read bool (varint decoded)
    #[napi]
    pub fn bool(&mut self) -> Result<bool> {
        let val = decode_varint32(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))?;
        Ok(val != 0)
    }

    /// Read fixed32 (little-endian 4 bytes)
    #[napi]
    pub fn fixed32(&mut self) -> Result<u32> {
        if self.pos + 4 > self.buffer.len() {
            return Err(Error::from_reason("Unexpected end of buffer"));
        }
        let val = u32::from_le_bytes([
            self.buffer[self.pos],
            self.buffer[self.pos + 1],
            self.buffer[self.pos + 2],
            self.buffer[self.pos + 3],
        ]);
        self.pos += 4;
        Ok(val)
    }

    /// Read sfixed32 (little-endian 4 bytes)
    #[napi]
    pub fn sfixed32(&mut self) -> Result<i32> {
        if self.pos + 4 > self.buffer.len() {
            return Err(Error::from_reason("Unexpected end of buffer"));
        }
        let val = i32::from_le_bytes([
            self.buffer[self.pos],
            self.buffer[self.pos + 1],
            self.buffer[self.pos + 2],
            self.buffer[self.pos + 3],
        ]);
        self.pos += 4;
        Ok(val)
    }

    /// Read fixed64 (little-endian 8 bytes)
    #[napi]
    pub fn fixed64(&mut self) -> Result<i64> {
        if self.pos + 8 > self.buffer.len() {
            return Err(Error::from_reason("Unexpected end of buffer"));
        }
        let val = u64::from_le_bytes([
            self.buffer[self.pos],
            self.buffer[self.pos + 1],
            self.buffer[self.pos + 2],
            self.buffer[self.pos + 3],
            self.buffer[self.pos + 4],
            self.buffer[self.pos + 5],
            self.buffer[self.pos + 6],
            self.buffer[self.pos + 7],
        ]);
        self.pos += 8;
        Ok(val as i64)
    }

    /// Read sfixed64 (little-endian 8 bytes)
    #[napi]
    pub fn sfixed64(&mut self) -> Result<i64> {
        if self.pos + 8 > self.buffer.len() {
            return Err(Error::from_reason("Unexpected end of buffer"));
        }
        let val = i64::from_le_bytes([
            self.buffer[self.pos],
            self.buffer[self.pos + 1],
            self.buffer[self.pos + 2],
            self.buffer[self.pos + 3],
            self.buffer[self.pos + 4],
            self.buffer[self.pos + 5],
            self.buffer[self.pos + 6],
            self.buffer[self.pos + 7],
        ]);
        self.pos += 8;
        Ok(val)
    }

    /// Read float (32-bit, little-endian)
    #[napi]
    pub fn float(&mut self) -> Result<f64> {
        if self.pos + 4 > self.buffer.len() {
            return Err(Error::from_reason("Unexpected end of buffer"));
        }
        let val = f32::from_le_bytes([
            self.buffer[self.pos],
            self.buffer[self.pos + 1],
            self.buffer[self.pos + 2],
            self.buffer[self.pos + 3],
        ]);
        self.pos += 4;
        Ok(val as f64)
    }

    /// Read double (64-bit, little-endian)
    #[napi]
    pub fn double(&mut self) -> Result<f64> {
        if self.pos + 8 > self.buffer.len() {
            return Err(Error::from_reason("Unexpected end of buffer"));
        }
        let val = f64::from_le_bytes([
            self.buffer[self.pos],
            self.buffer[self.pos + 1],
            self.buffer[self.pos + 2],
            self.buffer[self.pos + 3],
            self.buffer[self.pos + 4],
            self.buffer[self.pos + 5],
            self.buffer[self.pos + 6],
            self.buffer[self.pos + 7],
        ]);
        self.pos += 8;
        Ok(val)
    }

    /// Read bytes (length-delimited)
    #[napi]
    pub fn bytes(&mut self) -> Result<Buffer> {
        let len = decode_varint32(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))? as usize;
        
        if self.pos + len > self.buffer.len() {
            return Err(Error::from_reason("Unexpected end of buffer"));
        }
        
        let bytes = self.buffer[self.pos..self.pos + len].to_vec();
        self.pos += len;
        
        Ok(Buffer::from(bytes))
    }

    /// Read string (UTF-8, length-delimited)
    #[napi]
    pub fn string(&mut self) -> Result<String> {
        let len = decode_varint32(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))? as usize;
        
        if self.pos + len > self.buffer.len() {
            return Err(Error::from_reason("Unexpected end of buffer"));
        }
        
        let str_bytes = &self.buffer[self.pos..self.pos + len];
        self.pos += len;
        
        String::from_utf8(str_bytes.to_vec())
            .map_err(|_| Error::from_reason("Invalid UTF-8 string"))
    }

    /// Skip a specific number of bytes
    #[napi]
    pub fn skip(&mut self, length: u32) -> Result<&Self> {
        let len = length as usize;
        if self.pos + len > self.buffer.len() {
            return Err(Error::from_reason("Unexpected end of buffer"));
        }
        self.pos += len;
        Ok(self)
    }

    /// Skip a field based on wire type
    #[napi]
    pub fn skip_type(&mut self, wire_type: u32) -> Result<&Self> {
        let wt = WireType::from_u8(wire_type as u8)
            .ok_or_else(|| Error::from_reason("Invalid wire type"))?;
        
        match wt {
            WireType::Varint => {
                decode_varint64(&self.buffer, &mut self.pos)
                    .map_err(|e| Error::from_reason(e))?;
            }
            WireType::Fixed64 => {
                if self.pos + 8 > self.buffer.len() {
                    return Err(Error::from_reason("Unexpected end of buffer"));
                }
                self.pos += 8;
            }
            WireType::LengthDelimited => {
                let len = decode_varint32(&self.buffer, &mut self.pos)
                    .map_err(|e| Error::from_reason(e))? as usize;
                if self.pos + len > self.buffer.len() {
                    return Err(Error::from_reason("Unexpected end of buffer"));
                }
                self.pos += len;
            }
            WireType::Fixed32 => {
                if self.pos + 4 > self.buffer.len() {
                    return Err(Error::from_reason("Unexpected end of buffer"));
                }
                self.pos += 4;
            }
            WireType::StartGroup | WireType::EndGroup => {
                return Err(Error::from_reason("Groups are not supported"));
            }
        }
        
        Ok(self)
    }

    /// Get current position
    #[napi]
    pub fn pos(&self) -> u32 {
        self.pos as u32
    }
}
