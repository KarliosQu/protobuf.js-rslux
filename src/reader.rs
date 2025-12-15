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
    /// Create a new Reader from a Uint8Array or Buffer
    #[napi(constructor)]
    pub fn new(buffer: Buffer) -> Self {
        Reader {
            buffer: buffer.to_vec(),
            pos: 0,
        }
    }

    /// Get current position
    #[napi]
    pub fn get_pos(&self) -> u32 {
        self.pos as u32
    }

    /// Read a varint as u32
    #[napi]
    pub fn read_varint32(&mut self) -> Result<u32> {
        decode_varint32(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))
    }

    /// Read a varint as u64
    #[napi]
    pub fn read_varint64(&mut self) -> Result<i64> {
        let val = decode_varint64(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))?;
        // JavaScript can't handle full u64, return as i64
        Ok(val as i64)
    }

    /// Read a signed varint (zigzag encoded) as i32
    #[napi]
    pub fn read_sint32(&mut self) -> Result<i32> {
        let val = decode_varint32(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))?;
        Ok(zigzag_decode32(val))
    }

    /// Read a signed varint (zigzag encoded) as i64
    #[napi]
    pub fn read_sint64(&mut self) -> Result<i64> {
        let val = decode_varint64(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))?;
        Ok(zigzag_decode64(val))
    }

    /// Read fixed32
    #[napi]
    pub fn read_fixed32(&mut self) -> Result<u32> {
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

    /// Read fixed64
    #[napi]
    pub fn read_fixed64(&mut self) -> Result<i64> {
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

    /// Read sfixed32 (signed fixed32)
    #[napi]
    pub fn read_sfixed32(&mut self) -> Result<i32> {
        let val = self.read_fixed32()?;
        Ok(val as i32)
    }

    /// Read sfixed64 (signed fixed64)
    #[napi]
    pub fn read_sfixed64(&mut self) -> Result<i64> {
        self.read_fixed64()
    }

    /// Read float (32-bit)
    #[napi]
    pub fn read_float(&mut self) -> Result<f64> {
        let bits = self.read_fixed32()?;
        Ok(f32::from_bits(bits) as f64)
    }

    /// Read double (64-bit)
    #[napi]
    pub fn read_double(&mut self) -> Result<f64> {
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

    /// Read boolean
    #[napi]
    pub fn read_bool(&mut self) -> Result<bool> {
        let val = self.read_varint32()?;
        Ok(val != 0)
    }

    /// Read string (UTF-8 encoded)
    #[napi]
    pub fn read_string(&mut self) -> Result<String> {
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

    /// Read bytes
    #[napi]
    pub fn read_bytes(&mut self) -> Result<Buffer> {
        let len = decode_varint32(&self.buffer, &mut self.pos)
            .map_err(|e| Error::from_reason(e))? as usize;
        
        if self.pos + len > self.buffer.len() {
            return Err(Error::from_reason("Unexpected end of buffer"));
        }
        
        let bytes = self.buffer[self.pos..self.pos + len].to_vec();
        self.pos += len;
        
        Ok(Buffer::from(bytes))
    }

    /// Skip a field based on wire type
    #[napi]
    pub fn skip_type(&mut self, wire_type: u32) -> Result<()> {
        let wt = WireType::from_u8(wire_type as u8)
            .ok_or_else(|| Error::from_reason("Invalid wire type"))?;
        
        match wt {
            WireType::Varint => {
                self.read_varint64()?;
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
        
        Ok(())
    }

    /// Check if there are more bytes to read
    #[napi]
    pub fn has_more(&self) -> bool {
        self.pos < self.buffer.len()
    }

    /// Read exact number of bytes (without length prefix)
    #[napi]
    pub fn read_raw_bytes(&mut self, length: u32) -> Result<Buffer> {
        let len = length as usize;
        if self.pos + len > self.buffer.len() {
            return Err(Error::from_reason("Unexpected end of buffer"));
        }
        
        let bytes = self.buffer[self.pos..self.pos + len].to_vec();
        self.pos += len;
        
        Ok(Buffer::from(bytes))
    }
}
