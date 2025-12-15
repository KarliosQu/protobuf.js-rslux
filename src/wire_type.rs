/// Protocol Buffer wire types
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum WireType {
    Varint = 0,
    Fixed64 = 1,
    LengthDelimited = 2,
    StartGroup = 3,
    EndGroup = 4,
    Fixed32 = 5,
}

impl WireType {
    pub fn from_u8(value: u8) -> Option<WireType> {
        match value {
            0 => Some(WireType::Varint),
            1 => Some(WireType::Fixed64),
            2 => Some(WireType::LengthDelimited),
            3 => Some(WireType::StartGroup),
            4 => Some(WireType::EndGroup),
            5 => Some(WireType::Fixed32),
            _ => None,
        }
    }
}

/// Encode a field tag (field number and wire type)
#[inline]
pub fn encode_tag(field_number: u32, wire_type: WireType) -> u32 {
    (field_number << 3) | (wire_type as u32)
}

/// Decode a field tag into field number and wire type
#[inline]
pub fn decode_tag(tag: u32) -> (u32, Option<WireType>) {
    let field_number = tag >> 3;
    let wire_type = WireType::from_u8((tag & 0x7) as u8);
    (field_number, wire_type)
}
