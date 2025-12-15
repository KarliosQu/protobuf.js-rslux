/**
 * Benchmark comparison between protobuf-rslux (Rust) and protobufjs (JavaScript)
 * 运行benchmark，输出rust修改版和原版的比较结果
 */

// Import Rust version (protobuf-rslux)
const {
  Message: RustMessage,
  Reader: RustReader,
  Writer: RustWriter,
  WIRE_TYPE_VARINT: RUST_VARINT,
  WIRE_TYPE_LENGTH_DELIMITED: RUST_LENGTH_DELIMITED,
} = require('./message.js');

// Import original JavaScript version (protobufjs)
const protobuf = require('protobufjs/minimal');
const JSReader = protobuf.Reader;
const JSWriter = protobuf.Writer;

console.log('📊 Benchmark Comparison: Rust vs JavaScript');
console.log('='.repeat(70));
console.log('Rust Version: protobuf-rslux (NAPI-RS native module)');
console.log('JavaScript Version: protobufjs/minimal');
console.log('='.repeat(70));
console.log('');

// Define Rust version message class
class RustBenchmarkMessage extends RustMessage {
  constructor(properties) {
    super(properties);
    this.id = properties?.id || 0;
    this.name = properties?.name || '';
    this.email = properties?.email || '';
    this.age = properties?.age || 0;
    this.score = properties?.score || 0.0;
    this.active = properties?.active || false;
    this.tags = properties?.tags || [];
  }

  static encode(message, writer) {
    if (!writer) writer = new RustWriter();
    
    if (message.id !== 0) {
      writer.writeTag(1, RUST_VARINT);
      writer.writeVarint32(message.id);
    }
    
    if (message.name !== '') {
      writer.writeTag(2, RUST_LENGTH_DELIMITED);
      writer.writeString(message.name);
    }
    
    if (message.email !== '') {
      writer.writeTag(3, RUST_LENGTH_DELIMITED);
      writer.writeString(message.email);
    }
    
    if (message.age !== 0) {
      writer.writeTag(4, RUST_VARINT);
      writer.writeVarint32(message.age);
    }
    
    if (message.score !== 0.0) {
      writer.writeTag(5, 0x01); // WIRE_TYPE_FIXED64
      writer.writeDouble(message.score);
    }
    
    if (message.active !== false) {
      writer.writeTag(6, RUST_VARINT);
      writer.writeBool(message.active);
    }
    
    if (message.tags && message.tags.length) {
      for (const tag of message.tags) {
        writer.writeTag(7, RUST_LENGTH_DELIMITED);
        writer.writeString(tag);
      }
    }
    
    return writer;
  }

  static decode(reader) {
    if (!(reader instanceof RustReader)) {
      reader = new RustReader(Buffer.from(reader));
    }
    
    const message = new RustBenchmarkMessage();
    
    while (reader.hasMore()) {
      const tag = reader.readVarint32();
      const fieldNumber = tag >>> 3;
      const wireType = tag & 0x7;
      
      switch (fieldNumber) {
        case 1: message.id = reader.readVarint32(); break;
        case 2: message.name = reader.readString(); break;
        case 3: message.email = reader.readString(); break;
        case 4: message.age = reader.readVarint32(); break;
        case 5: message.score = reader.readDouble(); break;
        case 6: message.active = reader.readBool(); break;
        case 7:
          if (!message.tags) message.tags = [];
          message.tags.push(reader.readString());
          break;
        default: reader.skipType(wireType); break;
      }
    }
    
    return message;
  }
}

// Define JavaScript version message class (using protobufjs)
class JSBenchmarkMessage {
  constructor(properties) {
    this.id = properties?.id || 0;
    this.name = properties?.name || '';
    this.email = properties?.email || '';
    this.age = properties?.age || 0;
    this.score = properties?.score || 0.0;
    this.active = properties?.active || false;
    this.tags = properties?.tags || [];
  }

  static encode(message, writer) {
    if (!writer) writer = JSWriter.create();
    
    if (message.id !== 0) {
      writer.uint32(8).int32(message.id);
    }
    
    if (message.name !== '') {
      writer.uint32(18).string(message.name);
    }
    
    if (message.email !== '') {
      writer.uint32(26).string(message.email);
    }
    
    if (message.age !== 0) {
      writer.uint32(32).int32(message.age);
    }
    
    if (message.score !== 0.0) {
      writer.uint32(41).double(message.score);
    }
    
    if (message.active !== false) {
      writer.uint32(48).bool(message.active);
    }
    
    if (message.tags && message.tags.length) {
      for (const tag of message.tags) {
        writer.uint32(58).string(tag);
      }
    }
    
    return writer;
  }

  static decode(reader, length) {
    if (!(reader instanceof JSReader)) {
      reader = JSReader.create(Buffer.from(reader));
    }
    
    const message = new JSBenchmarkMessage();
    const end = length === undefined ? reader.len : reader.pos + length;
    
    while (reader.pos < end) {
      const tag = reader.uint32();
      const fieldNumber = tag >>> 3;
      
      switch (fieldNumber) {
        case 1: message.id = reader.int32(); break;
        case 2: message.name = reader.string(); break;
        case 3: message.email = reader.string(); break;
        case 4: message.age = reader.int32(); break;
        case 5: message.score = reader.double(); break;
        case 6: message.active = reader.bool(); break;
        case 7:
          if (!message.tags) message.tags = [];
          message.tags.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    
    return message;
  }
}

// Create test data
const testData = {
  id: 12345,
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30,
  score: 95.5,
  active: true,
  tags: ['developer', 'rust', 'javascript', 'protobuf'],
};

console.log('Test Message Configuration:');
console.log('  Fields: 7 (mixed types)');
console.log('  Repeated fields: 4 strings');
console.log('  Data:', JSON.stringify(testData, null, 2));
console.log('');

// Benchmark configuration
const ITERATIONS = 100000;
const WARMUP = 10000;

function benchmark(name, fn) {
  // Warmup
  for (let i = 0; i < WARMUP; i++) {
    fn();
  }
  
  // Collect garbage before benchmarking
  if (global.gc) {
    global.gc();
  }
  
  // Actual benchmark
  const start = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    fn();
  }
  const end = process.hrtime.bigint();
  const elapsed = Number(end - start) / 1_000_000; // Convert to milliseconds
  
  const opsPerSec = Math.round(ITERATIONS / elapsed * 1000);
  const msPerOp = (elapsed / ITERATIONS).toFixed(4);
  
  return { elapsed, opsPerSec, msPerOp };
}

// Benchmark 1: Message Encoding
console.log('Benchmark 1: Message Encoding');
console.log('-'.repeat(70));

const rustTestMessage = new RustBenchmarkMessage(testData);
const rustEncodeResults = benchmark('Rust Encode', () => {
  RustBenchmarkMessage.encode(rustTestMessage).finish();
});

const jsTestMessage = new JSBenchmarkMessage(testData);
const jsEncodeResults = benchmark('JS Encode', () => {
  JSBenchmarkMessage.encode(jsTestMessage).finish();
});

console.log(`Rust (protobuf-rslux):`);
console.log(`  Time: ${rustEncodeResults.elapsed.toFixed(2)} ms`);
console.log(`  Throughput: ${rustEncodeResults.opsPerSec.toLocaleString()} ops/sec`);
console.log(`  Latency: ${rustEncodeResults.msPerOp} ms/op`);
console.log('');
console.log(`JavaScript (protobufjs):`);
console.log(`  Time: ${jsEncodeResults.elapsed.toFixed(2)} ms`);
console.log(`  Throughput: ${jsEncodeResults.opsPerSec.toLocaleString()} ops/sec`);
console.log(`  Latency: ${jsEncodeResults.msPerOp} ms/op`);
console.log('');
const encodeSpeedup = (jsEncodeResults.elapsed / rustEncodeResults.elapsed).toFixed(2);
console.log(`⚡ Speedup: ${encodeSpeedup}x faster`);
console.log('');

// Benchmark 2: Message Decoding
console.log('Benchmark 2: Message Decoding');
console.log('-'.repeat(70));

const rustEncodedBuffer = RustBenchmarkMessage.encode(rustTestMessage).finish();
const rustDecodeResults = benchmark('Rust Decode', () => {
  RustBenchmarkMessage.decode(rustEncodedBuffer);
});

const jsEncodedBuffer = JSBenchmarkMessage.encode(jsTestMessage).finish();
const jsDecodeResults = benchmark('JS Decode', () => {
  JSBenchmarkMessage.decode(jsEncodedBuffer);
});

console.log(`Rust (protobuf-rslux):`);
console.log(`  Time: ${rustDecodeResults.elapsed.toFixed(2)} ms`);
console.log(`  Throughput: ${rustDecodeResults.opsPerSec.toLocaleString()} ops/sec`);
console.log(`  Latency: ${rustDecodeResults.msPerOp} ms/op`);
console.log('');
console.log(`JavaScript (protobufjs):`);
console.log(`  Time: ${jsDecodeResults.elapsed.toFixed(2)} ms`);
console.log(`  Throughput: ${jsDecodeResults.opsPerSec.toLocaleString()} ops/sec`);
console.log(`  Latency: ${jsDecodeResults.msPerOp} ms/op`);
console.log('');
const decodeSpeedup = (jsDecodeResults.elapsed / rustDecodeResults.elapsed).toFixed(2);
console.log(`⚡ Speedup: ${decodeSpeedup}x faster`);
console.log('');

// Benchmark 3: Full Roundtrip
console.log('Benchmark 3: Encode + Decode Roundtrip');
console.log('-'.repeat(70));

const rustRoundtripResults = benchmark('Rust Roundtrip', () => {
  const buf = RustBenchmarkMessage.encode(rustTestMessage).finish();
  RustBenchmarkMessage.decode(buf);
});

const jsRoundtripResults = benchmark('JS Roundtrip', () => {
  const buf = JSBenchmarkMessage.encode(jsTestMessage).finish();
  JSBenchmarkMessage.decode(buf);
});

console.log(`Rust (protobuf-rslux):`);
console.log(`  Time: ${rustRoundtripResults.elapsed.toFixed(2)} ms`);
console.log(`  Throughput: ${rustRoundtripResults.opsPerSec.toLocaleString()} ops/sec`);
console.log(`  Latency: ${rustRoundtripResults.msPerOp} ms/op`);
console.log('');
console.log(`JavaScript (protobufjs):`);
console.log(`  Time: ${jsRoundtripResults.elapsed.toFixed(2)} ms`);
console.log(`  Throughput: ${jsRoundtripResults.opsPerSec.toLocaleString()} ops/sec`);
console.log(`  Latency: ${jsRoundtripResults.msPerOp} ms/op`);
console.log('');
const roundtripSpeedup = (jsRoundtripResults.elapsed / rustRoundtripResults.elapsed).toFixed(2);
console.log(`⚡ Speedup: ${roundtripSpeedup}x faster`);
console.log('');

// Benchmark 4: Small Message
console.log('Benchmark 4: Small Message (1 field)');
console.log('-'.repeat(70));

const smallData = { id: 1 };
const rustSmallMessage = new RustBenchmarkMessage(smallData);
const jsSmallMessage = new JSBenchmarkMessage(smallData);

const rustSmallResults = benchmark('Rust Small', () => {
  const buf = RustBenchmarkMessage.encode(rustSmallMessage).finish();
  RustBenchmarkMessage.decode(buf);
});

const jsSmallResults = benchmark('JS Small', () => {
  const buf = JSBenchmarkMessage.encode(jsSmallMessage).finish();
  JSBenchmarkMessage.decode(buf);
});

console.log(`Rust (protobuf-rslux):`);
console.log(`  Throughput: ${rustSmallResults.opsPerSec.toLocaleString()} ops/sec`);
console.log('');
console.log(`JavaScript (protobufjs):`);
console.log(`  Throughput: ${jsSmallResults.opsPerSec.toLocaleString()} ops/sec`);
console.log('');
const smallSpeedup = (jsSmallResults.elapsed / rustSmallResults.elapsed).toFixed(2);
console.log(`⚡ Speedup: ${smallSpeedup}x faster`);
console.log('');

// Benchmark 5: Low-level Writer/Reader Operations
console.log('Benchmark 5: Low-level Writer/Reader Operations');
console.log('-'.repeat(70));

const rustWriterResults = benchmark('Rust Writer', () => {
  const w = new RustWriter();
  w.writeVarint32(12345);
  w.finish();
});

const jsWriterResults = benchmark('JS Writer', () => {
  const w = JSWriter.create();
  w.int32(12345);
  w.finish();
});

console.log(`Rust Writer (varint32):`);
console.log(`  Throughput: ${rustWriterResults.opsPerSec.toLocaleString()} ops/sec`);
console.log('');
console.log(`JavaScript Writer (varint32):`);
console.log(`  Throughput: ${jsWriterResults.opsPerSec.toLocaleString()} ops/sec`);
console.log('');
const writerSpeedup = (jsWriterResults.elapsed / rustWriterResults.elapsed).toFixed(2);
console.log(`⚡ Speedup: ${writerSpeedup}x faster`);
console.log('');

const rustReaderBuffer = Buffer.from([0xB9, 0x60]); // 12345 encoded
const rustReaderResults = benchmark('Rust Reader', () => {
  const r = new RustReader(rustReaderBuffer);
  r.readVarint32();
});

const jsReaderBuffer = Buffer.from([0xB9, 0x60]);
const jsReaderResults = benchmark('JS Reader', () => {
  const r = JSReader.create(jsReaderBuffer);
  r.int32();
});

console.log(`Rust Reader (varint32):`);
console.log(`  Throughput: ${rustReaderResults.opsPerSec.toLocaleString()} ops/sec`);
console.log('');
console.log(`JavaScript Reader (varint32):`);
console.log(`  Throughput: ${jsReaderResults.opsPerSec.toLocaleString()} ops/sec`);
console.log('');
const readerSpeedup = (jsReaderResults.elapsed / rustReaderResults.elapsed).toFixed(2);
console.log(`⚡ Speedup: ${readerSpeedup}x faster`);
console.log('');

// Overall Summary
console.log('='.repeat(70));
console.log('📊 OVERALL COMPARISON SUMMARY');
console.log('='.repeat(70));
console.log('');
console.log('Performance Improvements (Rust vs JavaScript):');
console.log('');
console.log(`  Encoding:           ${rustEncodeResults.opsPerSec.toLocaleString()} vs ${jsEncodeResults.opsPerSec.toLocaleString()} ops/sec  (${encodeSpeedup}x)`);
console.log(`  Decoding:           ${rustDecodeResults.opsPerSec.toLocaleString()} vs ${jsDecodeResults.opsPerSec.toLocaleString()} ops/sec  (${decodeSpeedup}x)`);
console.log(`  Roundtrip:          ${rustRoundtripResults.opsPerSec.toLocaleString()} vs ${jsRoundtripResults.opsPerSec.toLocaleString()} ops/sec  (${roundtripSpeedup}x)`);
console.log(`  Small Messages:     ${rustSmallResults.opsPerSec.toLocaleString()} vs ${jsSmallResults.opsPerSec.toLocaleString()} ops/sec  (${smallSpeedup}x)`);
console.log(`  Writer Operations:  ${rustWriterResults.opsPerSec.toLocaleString()} vs ${jsWriterResults.opsPerSec.toLocaleString()} ops/sec  (${writerSpeedup}x)`);
console.log(`  Reader Operations:  ${rustReaderResults.opsPerSec.toLocaleString()} vs ${jsReaderResults.opsPerSec.toLocaleString()} ops/sec  (${readerSpeedup}x)`);
console.log('');

// Calculate average speedup
const avgSpeedup = (
  parseFloat(encodeSpeedup) +
  parseFloat(decodeSpeedup) +
  parseFloat(roundtripSpeedup) +
  parseFloat(smallSpeedup) +
  parseFloat(writerSpeedup) +
  parseFloat(readerSpeedup)
) / 6;

console.log(`🚀 Average Performance Improvement: ${avgSpeedup.toFixed(2)}x faster`);
console.log('');
console.log('Message Size Comparison:');
console.log(`  Rust encoded size:  ${rustEncodedBuffer.length} bytes`);
console.log(`  JS encoded size:    ${jsEncodedBuffer.length} bytes`);
console.log(`  Binary compatible:  ${Buffer.compare(rustEncodedBuffer, jsEncodedBuffer) === 0 ? '✅ Yes' : '❌ No'}`);
console.log('');
console.log('🎉 Benchmark comparison completed!');
console.log('');
console.log('Note: Run with --expose-gc flag for more accurate results:');
console.log('  node --expose-gc benchmark-comparison.js');
