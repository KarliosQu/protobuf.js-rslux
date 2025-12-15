/**
 * Comprehensive unit tests for protobufjs-rslux
 * Tests all data types and edge cases
 */

const { Writer, Reader, encodeVarint, decodeVarint } = require('./index.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.error(`✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.error(`✗ ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
  }
}

function assertBufferEqual(actual, expected, message) {
  if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
    if (actual.equals(expected)) {
      passed++;
      console.log(`✓ ${message}`);
    } else {
      failed++;
      console.error(`✗ ${message}`);
      console.error(`  Expected: ${expected.toString('hex')}`);
      console.error(`  Actual: ${actual.toString('hex')}`);
    }
  } else {
    failed++;
    console.error(`✗ ${message} - Not buffers`);
  }
}

console.log('=== Testing encodeVarint and decodeVarint ===\n');

// Test varint encoding/decoding
const varint1 = encodeVarint(0);
assertBufferEqual(varint1, Buffer.from([0x00]), 'encodeVarint(0)');

const varint2 = encodeVarint(1);
assertBufferEqual(varint2, Buffer.from([0x01]), 'encodeVarint(1)');

const varint3 = encodeVarint(127);
assertBufferEqual(varint3, Buffer.from([0x7f]), 'encodeVarint(127)');

const varint4 = encodeVarint(128);
assertBufferEqual(varint4, Buffer.from([0x80, 0x01]), 'encodeVarint(128)');

const varint5 = encodeVarint(300);
assertBufferEqual(varint5, Buffer.from([0xac, 0x02]), 'encodeVarint(300)');

// Test varint decoding
const decoded1 = decodeVarint(Buffer.from([0x00]), 0);
assertEqual(Number(decoded1.value), 0, 'decodeVarint(0).value');
assertEqual(decoded1.length, 1, 'decodeVarint(0).length');

const decoded2 = decodeVarint(Buffer.from([0x01]), 0);
assertEqual(Number(decoded2.value), 1, 'decodeVarint(1).value');

const decoded3 = decodeVarint(Buffer.from([0x7f]), 0);
assertEqual(Number(decoded3.value), 127, 'decodeVarint(127).value');

const decoded4 = decodeVarint(Buffer.from([0x80, 0x01]), 0);
assertEqual(Number(decoded4.value), 128, 'decodeVarint(128).value');
assertEqual(decoded4.length, 2, 'decodeVarint(128).length');

const decoded5 = decodeVarint(Buffer.from([0xac, 0x02]), 0);
assertEqual(Number(decoded5.value), 300, 'decodeVarint(300).value');

console.log('\n=== Testing Writer ===\n');

// Test uint32
let writer = new Writer();
writer.uint32(150);
let buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0x96, 0x01]), 'Writer.uint32(150)');

// Test int32 (positive)
writer = new Writer();
writer.int32(150);
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0x96, 0x01]), 'Writer.int32(150)');

// Test int32 (negative) - should use 10 bytes
writer = new Writer();
writer.int32(-1);
buffer = writer.finish();
assert(buffer.length === 10, 'Writer.int32(-1) uses 10 bytes');

// Test sint32 (positive)
writer = new Writer();
writer.sint32(150);
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0xac, 0x02]), 'Writer.sint32(150) - zigzag encoded');

// Test sint32 (negative)
writer = new Writer();
writer.sint32(-150);
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0xab, 0x02]), 'Writer.sint32(-150) - zigzag encoded');

// Test uint64
writer = new Writer();
writer.uint64(1000);
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0xe8, 0x07]), 'Writer.uint64(1000)');

// Test bool
writer = new Writer();
writer.bool(true);
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0x01]), 'Writer.bool(true)');

writer = new Writer();
writer.bool(false);
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0x00]), 'Writer.bool(false)');

// Test fixed32
writer = new Writer();
writer.fixed32(0x12345678);
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0x78, 0x56, 0x34, 0x12]), 'Writer.fixed32(0x12345678) - little endian');

// Test sfixed32
writer = new Writer();
writer.sfixed32(-1);
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0xff, 0xff, 0xff, 0xff]), 'Writer.sfixed32(-1)');

// Test fixed64
writer = new Writer();
writer.fixed64(0x123456789abcdef0);
buffer = writer.finish();
assert(buffer.length === 8, 'Writer.fixed64 produces 8 bytes');

// Test float
writer = new Writer();
writer.float(3.14);
buffer = writer.finish();
assert(buffer.length === 4, 'Writer.float produces 4 bytes');

// Test double
writer = new Writer();
writer.double(3.14159265359);
buffer = writer.finish();
assert(buffer.length === 8, 'Writer.double produces 8 bytes');

// Test string
writer = new Writer();
writer.string('hello');
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f]), 'Writer.string("hello")');

// Test bytes
writer = new Writer();
writer.bytes(Buffer.from([0x01, 0x02, 0x03]));
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0x03, 0x01, 0x02, 0x03]), 'Writer.bytes([0x01, 0x02, 0x03])');

// Test chaining
writer = new Writer();
writer.uint32(1).uint32(2).uint32(3);
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0x01, 0x02, 0x03]), 'Writer method chaining');

// Test reset
writer = new Writer();
writer.uint32(100);
writer.reset();
writer.uint32(200);
buffer = writer.finish();
assertBufferEqual(buffer, Buffer.from([0xc8, 0x01]), 'Writer.reset() clears buffer');

console.log('\n=== Testing Reader ===\n');

// Test uint32
reader = new Reader(Buffer.from([0x96, 0x01]));
assertEqual(reader.uint32(), 150, 'Reader.uint32() reads 150');

// Test int32
reader = new Reader(Buffer.from([0x96, 0x01]));
assertEqual(reader.int32(), 150, 'Reader.int32() reads 150');

// Test sint32 (positive)
reader = new Reader(Buffer.from([0xac, 0x02]));
assertEqual(reader.sint32(), 150, 'Reader.sint32() reads 150');

// Test sint32 (negative)
reader = new Reader(Buffer.from([0xab, 0x02]));
assertEqual(reader.sint32(), -150, 'Reader.sint32() reads -150');

// Test uint64
reader = new Reader(Buffer.from([0xe8, 0x07]));
assertEqual(Number(reader.uint64()), 1000, 'Reader.uint64() reads 1000');

// Test bool
reader = new Reader(Buffer.from([0x01]));
assertEqual(reader.bool(), true, 'Reader.bool() reads true');

reader = new Reader(Buffer.from([0x00]));
assertEqual(reader.bool(), false, 'Reader.bool() reads false');

// Test fixed32
reader = new Reader(Buffer.from([0x78, 0x56, 0x34, 0x12]));
assertEqual(reader.fixed32(), 0x12345678, 'Reader.fixed32() reads 0x12345678');

// Test sfixed32
reader = new Reader(Buffer.from([0xff, 0xff, 0xff, 0xff]));
assertEqual(reader.sfixed32(), -1, 'Reader.sfixed32() reads -1');

// Test float
writer = new Writer();
writer.float(3.14);
buffer = writer.finish();
reader = new Reader(buffer);
const floatVal = reader.float();
assert(Math.abs(floatVal - 3.14) < 0.01, 'Reader.float() reads ~3.14');

// Test double
writer = new Writer();
writer.double(3.14159265359);
buffer = writer.finish();
reader = new Reader(buffer);
const doubleVal = reader.double();
assert(Math.abs(doubleVal - 3.14159265359) < 0.0001, 'Reader.double() reads ~3.14159265359');

// Test string
reader = new Reader(Buffer.from([0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f]));
assertEqual(reader.string(), 'hello', 'Reader.string() reads "hello"');

// Test bytes
reader = new Reader(Buffer.from([0x03, 0x01, 0x02, 0x03]));
assertBufferEqual(reader.bytes(), Buffer.from([0x01, 0x02, 0x03]), 'Reader.bytes() reads buffer');

// Test pos()
reader = new Reader(Buffer.from([0x01, 0x02, 0x03]));
assertEqual(reader.pos(), 0, 'Reader.pos() initially 0');
reader.uint32();
assertEqual(reader.pos(), 1, 'Reader.pos() after reading uint32');

// Test skip()
reader = new Reader(Buffer.from([0x01, 0x02, 0x03]));
reader.skip(2);
assertEqual(reader.pos(), 2, 'Reader.skip(2) advances position');

console.log('\n=== Testing Fork/Ldelim ===\n');

// Test fork/ldelim for nested messages
writer = new Writer();
writer.uint32(1);  // Field 1
writer.fork();
writer.uint32(10); // Nested field
writer.uint32(20); // Nested field
writer.ldelim();
writer.uint32(2);  // Field 2
buffer = writer.finish();
assert(buffer.length > 0, 'Fork/ldelim produces valid buffer');

// Verify the nested message has correct length prefix
reader = new Reader(buffer);
assertEqual(reader.uint32(), 1, 'Read field before fork');
const nestedLen = reader.uint32();
assert(nestedLen === 2, 'Nested message length is 2 bytes');
assertEqual(reader.uint32(), 10, 'Read first nested field');
assertEqual(reader.uint32(), 20, 'Read second nested field');
assertEqual(reader.uint32(), 2, 'Read field after ldelim');

console.log('\n=== Testing Round-trip Encoding ===\n');

// Test complete round-trip with various data types
writer = new Writer();
writer.uint32(42);
writer.sint32(-123);
writer.string('test');
writer.bool(true);
writer.fixed32(0xdeadbeef);
writer.double(2.71828);
buffer = writer.finish();

reader = new Reader(buffer);
assertEqual(reader.uint32(), 42, 'Round-trip uint32');
assertEqual(reader.sint32(), -123, 'Round-trip sint32');
assertEqual(reader.string(), 'test', 'Round-trip string');
assertEqual(reader.bool(), true, 'Round-trip bool');
assertEqual(reader.fixed32(), 0xdeadbeef, 'Round-trip fixed32');
assert(Math.abs(reader.double() - 2.71828) < 0.0001, 'Round-trip double');

console.log('\n=== Testing Edge Cases ===\n');

// Test empty string
writer = new Writer();
writer.string('');
buffer = writer.finish();
reader = new Reader(buffer);
assertEqual(reader.string(), '', 'Empty string encodes/decodes correctly');

// Test empty bytes
writer = new Writer();
writer.bytes(Buffer.alloc(0));
buffer = writer.finish();
reader = new Reader(buffer);
assertBufferEqual(reader.bytes(), Buffer.alloc(0), 'Empty bytes encodes/decodes correctly');

// Test zero values
writer = new Writer();
writer.uint32(0);
writer.int32(0);
writer.sint32(0);
writer.uint64(0);
writer.bool(false);
buffer = writer.finish();
reader = new Reader(buffer);
assertEqual(reader.uint32(), 0, 'Zero uint32');
assertEqual(reader.int32(), 0, 'Zero int32');
assertEqual(reader.sint32(), 0, 'Zero sint32');
assertEqual(Number(reader.uint64()), 0, 'Zero uint64');
assertEqual(reader.bool(), false, 'False bool');

// Test large values
writer = new Writer();
writer.uint32(0xFFFFFFFF);
writer.uint64(0xFFFFFFFF);
buffer = writer.finish();
reader = new Reader(buffer);
assertEqual(reader.uint32(), 0xFFFFFFFF, 'Max uint32');
assertEqual(Number(reader.uint64()), 0xFFFFFFFF, 'Large uint64');

// Print summary
console.log('\n=== Test Summary ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log(`\n❌ ${failed} test(s) failed!`);
  process.exit(1);
}
