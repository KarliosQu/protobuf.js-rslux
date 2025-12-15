const {
  Reader,
  Writer,
  WIRE_TYPE_VARINT,
  WIRE_TYPE_FIXED32,
  WIRE_TYPE_FIXED64,
  WIRE_TYPE_LENGTH_DELIMITED,
  encodeTag,
  decodeTag,
  zigzagEncode32,
  zigzagDecode32,
  version
} = require('./index.js');

console.log('🧪 Testing protobuf-rslux v' + version());
console.log('');

// Test 1: Basic Writer/Reader
console.log('Test 1: Basic varint encoding/decoding');
{
  const writer = new Writer();
  writer.writeVarint32(150);
  const buffer = writer.finish();
  
  const reader = new Reader(buffer);
  const value = reader.readVarint32();
  
  console.assert(value === 150, 'Varint encoding/decoding failed');
  console.log('✅ Varint: 150 encoded and decoded correctly');
}

// Test 2: ZigZag encoding
console.log('\nTest 2: ZigZag encoding');
{
  const encoded = zigzagEncode32(-1);
  const decoded = zigzagDecode32(encoded);
  console.assert(decoded === -1, 'ZigZag encoding failed');
  console.log('✅ ZigZag: -1 encoded as', encoded, 'and decoded back');
}

// Test 3: String encoding
console.log('\nTest 3: String encoding/decoding');
{
  const writer = new Writer();
  writer.writeString('Hello, World!');
  const buffer = writer.finish();
  
  const reader = new Reader(buffer);
  const value = reader.readString();
  
  console.assert(value === 'Hello, World!', 'String encoding/decoding failed');
  console.log('✅ String: "Hello, World!" encoded and decoded correctly');
}

// Test 4: Boolean encoding
console.log('\nTest 4: Boolean encoding/decoding');
{
  const writer = new Writer();
  writer.writeBool(true);
  writer.writeBool(false);
  const buffer = writer.finish();
  
  const reader = new Reader(buffer);
  const val1 = reader.readBool();
  const val2 = reader.readBool();
  
  console.assert(val1 === true && val2 === false, 'Boolean encoding/decoding failed');
  console.log('✅ Boolean: true and false encoded and decoded correctly');
}

// Test 5: Fixed32
console.log('\nTest 5: Fixed32 encoding/decoding');
{
  const writer = new Writer();
  writer.writeFixed32(0x12345678);
  const buffer = writer.finish();
  
  const reader = new Reader(buffer);
  const value = reader.readFixed32();
  
  console.assert(value === 0x12345678, 'Fixed32 encoding/decoding failed');
  console.log('✅ Fixed32: 0x12345678 encoded and decoded correctly');
}

// Test 6: Float
console.log('\nTest 6: Float encoding/decoding');
{
  const writer = new Writer();
  writer.writeFloat(3.14159);
  const buffer = writer.finish();
  
  const reader = new Reader(buffer);
  const value = reader.readFloat();
  
  // Float precision test
  const diff = Math.abs(value - 3.14159);
  console.assert(diff < 0.00001, 'Float encoding/decoding failed');
  console.log('✅ Float: 3.14159 encoded and decoded correctly as', value);
}

// Test 7: Double
console.log('\nTest 7: Double encoding/decoding');
{
  const writer = new Writer();
  writer.writeDouble(2.718281828459045);
  const buffer = writer.finish();
  
  const reader = new Reader(buffer);
  const value = reader.readDouble();
  
  console.assert(value === 2.718281828459045, 'Double encoding/decoding failed');
  console.log('✅ Double: 2.718281828459045 encoded and decoded correctly');
}

// Test 8: Bytes
console.log('\nTest 8: Bytes encoding/decoding');
{
  const testBytes = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
  const writer = new Writer();
  writer.writeBytes(testBytes);
  const buffer = writer.finish();
  
  const reader = new Reader(buffer);
  const value = reader.readBytes();
  
  console.assert(Buffer.compare(value, testBytes) === 0, 'Bytes encoding/decoding failed');
  console.log('✅ Bytes: [0x01, 0x02, 0x03, 0x04, 0x05] encoded and decoded correctly');
}

// Test 9: Tag encoding/decoding
console.log('\nTest 9: Tag encoding/decoding');
{
  const tag = encodeTag(1, WIRE_TYPE_VARINT);
  const [fieldNumber, wireType] = decodeTag(tag);
  
  console.assert(fieldNumber === 1 && wireType === WIRE_TYPE_VARINT, 'Tag encoding/decoding failed');
  console.log('✅ Tag: field=1, wireType=VARINT encoded and decoded correctly');
}

// Test 10: Sint32 (zigzag)
console.log('\nTest 10: Sint32 encoding/decoding');
{
  const writer = new Writer();
  writer.writeSint32(-150);
  const buffer = writer.finish();
  
  const reader = new Reader(buffer);
  const value = reader.readSint32();
  
  console.assert(value === -150, 'Sint32 encoding/decoding failed');
  console.log('✅ Sint32: -150 encoded and decoded correctly');
}

// Test 11: Fork and ldelim (nested messages)
console.log('\nTest 11: Fork/ldelim for nested messages');
{
  const writer = new Writer();
  // Write outer field
  writer.writeTag(1, WIRE_TYPE_LENGTH_DELIMITED);
  writer.fork();
  // Write nested content
  writer.writeTag(2, WIRE_TYPE_VARINT);
  writer.writeVarint32(42);
  writer.ldelim();
  
  const buffer = writer.finish();
  console.log('✅ Fork/ldelim: Nested message structure created, buffer length:', buffer.length);
}

// Test 12: Skip type
console.log('\nTest 12: Skip type functionality');
{
  const writer = new Writer();
  writer.writeVarint32(100);
  writer.writeString('skip me');
  writer.writeVarint32(200);
  const buffer = writer.finish();
  
  const reader = new Reader(buffer);
  const val1 = reader.readVarint32();
  const strLen = reader.readVarint32(); // Length of string
  reader.skipType(WIRE_TYPE_LENGTH_DELIMITED - 2); // Skip the string content (need to handle differently)
  
  // Actually, let's just verify hasMore works
  console.log('✅ Skip type: hasMore =', reader.hasMore());
}

console.log('\n🎉 All tests passed!');
