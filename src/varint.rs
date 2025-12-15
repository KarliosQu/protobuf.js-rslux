/// Varint encoding and decoding utilities

/// Encode a u32 as varint
pub fn encode_varint32(value: u32) -> Vec<u8> {
    let mut result = Vec::new();
    let mut val = value;
    loop {
        if val < 0x80 {
            result.push(val as u8);
            break;
        }
        result.push(((val & 0x7F) | 0x80) as u8);
        val >>= 7;
    }
    result
}

/// Encode a u64 as varint
pub fn encode_varint64(value: u64) -> Vec<u8> {
    let mut result = Vec::new();
    let mut val = value;
    loop {
        if val < 0x80 {
            result.push(val as u8);
            break;
        }
        result.push(((val & 0x7F) | 0x80) as u8);
        val >>= 7;
    }
    result
}

/// Decode varint from buffer starting at offset
pub fn decode_varint32(buffer: &[u8], offset: &mut usize) -> Result<u32, String> {
    let mut result: u32 = 0;
    let mut shift = 0;
    
    loop {
        if *offset >= buffer.len() {
            return Err("Unexpected end of buffer".to_string());
        }
        
        let byte = buffer[*offset];
        *offset += 1;
        
        if shift >= 32 {
            return Err("Varint too long".to_string());
        }
        
        result |= ((byte & 0x7F) as u32) << shift;
        
        if byte < 0x80 {
            break;
        }
        
        shift += 7;
    }
    
    Ok(result)
}

/// Decode varint64 from buffer starting at offset
pub fn decode_varint64(buffer: &[u8], offset: &mut usize) -> Result<u64, String> {
    let mut result: u64 = 0;
    let mut shift = 0;
    
    loop {
        if *offset >= buffer.len() {
            return Err("Unexpected end of buffer".to_string());
        }
        
        let byte = buffer[*offset];
        *offset += 1;
        
        if shift >= 64 {
            return Err("Varint too long".to_string());
        }
        
        result |= ((byte & 0x7F) as u64) << shift;
        
        if byte < 0x80 {
            break;
        }
        
        shift += 7;
    }
    
    Ok(result)
}

/// ZigZag encode a signed 32-bit integer
#[inline]
pub fn zigzag_encode32(value: i32) -> u32 {
    ((value << 1) ^ (value >> 31)) as u32
}

/// ZigZag decode to a signed 32-bit integer
#[inline]
pub fn zigzag_decode32(value: u32) -> i32 {
    ((value >> 1) as i32) ^ (-((value & 1) as i32))
}

/// ZigZag encode a signed 64-bit integer
#[inline]
pub fn zigzag_encode64(value: i64) -> u64 {
    ((value << 1) ^ (value >> 63)) as u64
}

/// ZigZag decode to a signed 64-bit integer
#[inline]
pub fn zigzag_decode64(value: u64) -> i64 {
    ((value >> 1) as i64) ^ (-((value & 1) as i64))
}
