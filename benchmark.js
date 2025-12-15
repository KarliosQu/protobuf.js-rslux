/**
 * Comprehensive benchmark for protobuf-rslux
 */

const {
  Message,
  Reader,
  Writer,
  WIRE_TYPE_VARINT,
  WIRE_TYPE_LENGTH_DELIMITED,
} = require('./message.js');

// Define a more complex benchmark message
class BenchmarkMessage extends Message {
  constructor(properties) {
    super(properties);
    this.id = properties?.id || 0;
    this.name = properties?.name || '';
    this.email = properties?.email || '';
    this.age = properties?.age || 0;
    this.score = properties?.score || 0.0;
    this.active = properties?.active || false;
    this.tags = properties?.tags || [];
    this.metadata = properties?.metadata || {};
  }

  static encode(message, writer) {
    if (!writer) writer = new Writer();
    
    if (message.id !== 0) {
      writer.writeTag(1, WIRE_TYPE_VARINT);
      writer.writeVarint32(message.id);
    }
    
    if (message.name !== '') {
      writer.writeTag(2, WIRE_TYPE_LENGTH_DELIMITED);
      writer.writeString(message.name);
    }
    
    if (message.email !== '') {
      writer.writeTag(3, WIRE_TYPE_LENGTH_DELIMITED);
      writer.writeString(message.email);
    }
    
    if (message.age !== 0) {
      writer.writeTag(4, WIRE_TYPE_VARINT);
      writer.writeVarint32(message.age);
    }
    
    if (message.score !== 0.0) {
      writer.writeTag(5, 0x01); // WIRE_TYPE_FIXED64 for double
      writer.writeDouble(message.score);
    }
    
    if (message.active !== false) {
      writer.writeTag(6, WIRE_TYPE_VARINT);
      writer.writeBool(message.active);
    }
    
    if (message.tags && message.tags.length) {
      for (const tag of message.tags) {
        writer.writeTag(7, WIRE_TYPE_LENGTH_DELIMITED);
        writer.writeString(tag);
      }
    }
    
    return writer;
  }

  static decode(reader) {
    if (!(reader instanceof Reader)) {
      reader = new Reader(Buffer.from(reader));
    }
    
    const message = new BenchmarkMessage();
    
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

console.log('📊 protobuf-rslux Comprehensive Benchmark');
console.log('='.repeat(60));
console.log('');

// Create test data
const testMessage = BenchmarkMessage.create({
  id: 12345,
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30,
  score: 95.5,
  active: true,
  tags: ['developer', 'rust', 'javascript', 'protobuf'],
});

// Pre-encode for decode benchmark
const encodedBuffer = BenchmarkMessage.encode(testMessage).finish();

console.log('Test Message:');
console.log('  Size:', encodedBuffer.length, 'bytes');
console.log('  Fields: 7 (mixed types)');
console.log('  Repeated fields: 4 strings');
console.log('');

// Benchmark configuration
const ITERATIONS = 100000;
const WARMUP = 10000;

function benchmark(name, fn) {
  // Warmup
  for (let i = 0; i < WARMUP; i++) {
    fn();
  }
  
  // Actual benchmark
  const start = Date.now();
  for (let i = 0; i < ITERATIONS; i++) {
    fn();
  }
  const elapsed = Date.now() - start;
  
  const opsPerSec = Math.round(ITERATIONS / elapsed * 1000);
  const msPerOp = (elapsed / ITERATIONS).toFixed(4);
  
  console.log(`${name}:`);
  console.log(`  Time: ${elapsed} ms`);
  console.log(`  Throughput: ${opsPerSec.toLocaleString()} ops/sec`);
  console.log(`  Latency: ${msPerOp} ms/op`);
  console.log('');
  
  return { elapsed, opsPerSec, msPerOp };
}

// Benchmark 1: Encoding
console.log('Benchmark 1: Message Encoding');
console.log('-'.repeat(60));
const encodeResults = benchmark('Encode', () => {
  BenchmarkMessage.encode(testMessage).finish();
});

// Benchmark 2: Decoding
console.log('Benchmark 2: Message Decoding');
console.log('-'.repeat(60));
const decodeResults = benchmark('Decode', () => {
  BenchmarkMessage.decode(encodedBuffer);
});

// Benchmark 3: Full roundtrip
console.log('Benchmark 3: Encode + Decode Roundtrip');
console.log('-'.repeat(60));
const roundtripResults = benchmark('Roundtrip', () => {
  const buf = BenchmarkMessage.encode(testMessage).finish();
  BenchmarkMessage.decode(buf);
});

// Benchmark 4: Small message
const smallMessage = BenchmarkMessage.create({ id: 1 });
const smallBuffer = BenchmarkMessage.encode(smallMessage).finish();
console.log('Benchmark 4: Small Message (1 field, ' + smallBuffer.length + ' bytes)');
console.log('-'.repeat(60));
const smallResults = benchmark('Small Message', () => {
  const buf = BenchmarkMessage.encode(smallMessage).finish();
  BenchmarkMessage.decode(buf);
});

// Benchmark 5: Writer/Reader primitives
console.log('Benchmark 5: Low-level Writer/Reader Operations');
console.log('-'.repeat(60));

const writerResults = benchmark('Writer (varint32)', () => {
  const w = new Writer();
  w.writeVarint32(12345);
  w.finish();
});

const readerResults = benchmark('Reader (varint32)', () => {
  const r = new Reader(Buffer.from([0xB9, 0x60])); // 12345 encoded
  r.readVarint32();
});

// Summary
console.log('='.repeat(60));
console.log('📈 SUMMARY');
console.log('='.repeat(60));
console.log('');
console.log('Encoding Performance:');
console.log(`  ${encodeResults.opsPerSec.toLocaleString()} ops/sec`);
console.log('');
console.log('Decoding Performance:');
console.log(`  ${decodeResults.opsPerSec.toLocaleString()} ops/sec`);
console.log('');
console.log('Roundtrip Performance:');
console.log(`  ${roundtripResults.opsPerSec.toLocaleString()} ops/sec`);
console.log('');
console.log('Small Message Performance:');
console.log(`  ${smallResults.opsPerSec.toLocaleString()} ops/sec`);
console.log('');
console.log('Low-level Operations:');
console.log(`  Writer: ${writerResults.opsPerSec.toLocaleString()} ops/sec`);
console.log(`  Reader: ${readerResults.opsPerSec.toLocaleString()} ops/sec`);
console.log('');

// Memory estimate
const avgMessageSize = encodedBuffer.length;
const messagesPerMB = Math.floor(1024 * 1024 / avgMessageSize);
console.log('Memory Efficiency:');
console.log(`  Avg message size: ${avgMessageSize} bytes`);
console.log(`  Messages per MB: ~${messagesPerMB.toLocaleString()}`);
console.log('');

console.log('🎉 Benchmark completed!');
