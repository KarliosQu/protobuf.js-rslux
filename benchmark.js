/**
 * Basic performance benchmark for protobufjs-rslux
 * Tests encoding and decoding performance across various scenarios
 */

const { Writer, Reader } = require('./index.js');

// Helper to format numbers
function formatNumber(num) {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Helper to measure performance
function benchmark(name, fn, iterations = 100000) {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();
  
  // Measure
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = process.hrtime.bigint();
  
  const durationMs = Number(end - start) / 1000000;
  const opsPerSec = (iterations / durationMs) * 1000;
  
  console.log(`${name.padEnd(40)} ${formatNumber(opsPerSec).padStart(15)} ops/sec`);
  
  return opsPerSec;
}

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║          protobufjs-rslux Performance Benchmark               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('=== Writer Performance ===\n');

// Test Writer operations
benchmark('Writer.uint32', () => {
  const w = new Writer();
  w.uint32(12345);
  w.finish();
});

benchmark('Writer.int32', () => {
  const w = new Writer();
  w.int32(-12345);
  w.finish();
});

benchmark('Writer.sint32', () => {
  const w = new Writer();
  w.sint32(-12345);
  w.finish();
});

benchmark('Writer.uint64', () => {
  const w = new Writer();
  w.uint64(123456789);
  w.finish();
});

benchmark('Writer.fixed32', () => {
  const w = new Writer();
  w.fixed32(0x12345678);
  w.finish();
});

benchmark('Writer.fixed64', () => {
  const w = new Writer();
  w.fixed64(0x123456789abcdef0);
  w.finish();
});

benchmark('Writer.float', () => {
  const w = new Writer();
  w.float(3.14159);
  w.finish();
});

benchmark('Writer.double', () => {
  const w = new Writer();
  w.double(3.14159265359);
  w.finish();
});

benchmark('Writer.string (short)', () => {
  const w = new Writer();
  w.string('hello');
  w.finish();
});

benchmark('Writer.string (medium)', () => {
  const w = new Writer();
  w.string('Hello, this is a medium-length test string for benchmarking!');
  w.finish();
});

benchmark('Writer.bytes (small)', () => {
  const w = new Writer();
  w.bytes(Buffer.from([1, 2, 3, 4, 5]));
  w.finish();
});

benchmark('Writer - chained operations', () => {
  const w = new Writer();
  w.uint32(1).uint32(2).uint32(3).uint32(4).uint32(5);
  w.finish();
});

console.log('\n=== Reader Performance ===\n');

// Test Reader operations
const uint32Buf = (() => { const w = new Writer(); w.uint32(12345); return w.finish(); })();
benchmark('Reader.uint32', () => {
  const r = new Reader(uint32Buf);
  r.uint32();
});

const int32Buf = (() => { const w = new Writer(); w.int32(-12345); return w.finish(); })();
benchmark('Reader.int32', () => {
  const r = new Reader(int32Buf);
  r.int32();
});

const sint32Buf = (() => { const w = new Writer(); w.sint32(-12345); return w.finish(); })();
benchmark('Reader.sint32', () => {
  const r = new Reader(sint32Buf);
  r.sint32();
});

const uint64Buf = (() => { const w = new Writer(); w.uint64(123456789); return w.finish(); })();
benchmark('Reader.uint64', () => {
  const r = new Reader(uint64Buf);
  r.uint64();
});

const fixed32Buf = (() => { const w = new Writer(); w.fixed32(0x12345678); return w.finish(); })();
benchmark('Reader.fixed32', () => {
  const r = new Reader(fixed32Buf);
  r.fixed32();
});

const fixed64Buf = (() => { const w = new Writer(); w.fixed64(0x123456789abcdef0); return w.finish(); })();
benchmark('Reader.fixed64', () => {
  const r = new Reader(fixed64Buf);
  r.fixed64();
});

const floatBuf = (() => { const w = new Writer(); w.float(3.14159); return w.finish(); })();
benchmark('Reader.float', () => {
  const r = new Reader(floatBuf);
  r.float();
});

const doubleBuf = (() => { const w = new Writer(); w.double(3.14159265359); return w.finish(); })();
benchmark('Reader.double', () => {
  const r = new Reader(doubleBuf);
  r.double();
});

const stringBuf = (() => { const w = new Writer(); w.string('hello'); return w.finish(); })();
benchmark('Reader.string (short)', () => {
  const r = new Reader(stringBuf);
  r.string();
});

const medStringBuf = (() => { const w = new Writer(); w.string('Hello, this is a medium-length test string for benchmarking!'); return w.finish(); })();
benchmark('Reader.string (medium)', () => {
  const r = new Reader(medStringBuf);
  r.string();
});

const bytesBuf = (() => { const w = new Writer(); w.bytes(Buffer.from([1, 2, 3, 4, 5])); return w.finish(); })();
benchmark('Reader.bytes (small)', () => {
  const r = new Reader(bytesBuf);
  r.bytes();
});

console.log('\n=== Complex Message Performance ===\n');

// Simulate a complex message with multiple fields
function encodeComplexMessage() {
  const w = new Writer();
  w.uint32(1);         // id
  w.string('John Doe'); // name
  w.uint32(30);        // age
  w.string('john@example.com'); // email
  w.bool(true);        // active
  w.double(1234.56);   // balance
  w.fixed32(0xdeadbeef); // token
  return w.finish();
}

const complexBuf = encodeComplexMessage();

benchmark('Encode - Complex message (7 fields)', () => {
  encodeComplexMessage();
});

benchmark('Decode - Complex message (7 fields)', () => {
  const r = new Reader(complexBuf);
  r.uint32();   // id
  r.string();   // name
  r.uint32();   // age
  r.string();   // email
  r.bool();     // active
  r.double();   // balance
  r.fixed32();  // token
});

benchmark('Round-trip - Complex message', () => {
  const buf = encodeComplexMessage();
  const r = new Reader(buf);
  r.uint32();
  r.string();
  r.uint32();
  r.string();
  r.bool();
  r.double();
  r.fixed32();
});

console.log('\n=== Message Size Scenarios ===\n');

// Small message
function encodeSmallMessage() {
  const w = new Writer();
  w.uint32(42);
  w.bool(true);
  return w.finish();
}

benchmark('Small message (2 fields)', () => {
  encodeSmallMessage();
});

// Medium message
function encodeMediumMessage() {
  const w = new Writer();
  for (let i = 0; i < 10; i++) {
    w.uint32(i);
  }
  return w.finish();
}

benchmark('Medium message (10 fields)', () => {
  encodeMediumMessage();
});

// Large message
function encodeLargeMessage() {
  const w = new Writer();
  for (let i = 0; i < 100; i++) {
    w.uint32(i);
  }
  return w.finish();
}

benchmark('Large message (100 fields)', () => {
  encodeLargeMessage();
}, 10000);

console.log('\n=== Nested Messages (fork/ldelim) ===\n');

function encodeNestedMessage() {
  const w = new Writer();
  w.uint32(1);
  w.fork();
  w.uint32(10);
  w.uint32(20);
  w.ldelim();
  w.uint32(2);
  return w.finish();
}

benchmark('Encode - Nested message', () => {
  encodeNestedMessage();
});

const nestedBuf = encodeNestedMessage();
benchmark('Decode - Nested message', () => {
  const r = new Reader(nestedBuf);
  r.uint32();
  const len = r.uint32();
  r.uint32();
  r.uint32();
  r.uint32();
});

console.log('\n=== Throughput Analysis ===\n');

const complexMsgSize = complexBuf.length;
const complexOpsPerSec = benchmark('Throughput test - Complex encoding', encodeComplexMessage, 100000);
const encodeThroughputMBps = (complexOpsPerSec * complexMsgSize) / (1024 * 1024);

console.log(`\nMessage size: ${complexMsgSize} bytes`);
console.log(`Encoding throughput: ${encodeThroughputMBps.toFixed(2)} MB/s`);
console.log(`Operations per second: ${formatNumber(complexOpsPerSec)} ops/sec`);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                    Benchmark Complete                          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
