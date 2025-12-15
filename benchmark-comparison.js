/**
 * Performance comparison benchmark: protobufjs-rslux (Rust) vs protobufjs (JavaScript)
 * Compares encoding and decoding performance across various scenarios
 */

const { Writer: RustWriter, Reader: RustReader } = require('./index.js');
const protobuf = require('protobufjs/minimal');

// Helper to format numbers
function formatNumber(num) {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Helper to measure performance
function benchmark(name, fn, iterations = 100000) {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();
  
  // Collect garbage before benchmark
  if (global.gc) {
    global.gc();
  }
  
  // Measure
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = process.hrtime.bigint();
  
  const durationMs = Number(end - start) / 1000000;
  const opsPerSec = (iterations / durationMs) * 1000;
  
  return opsPerSec;
}

function comparePerformance(description, rustFn, jsFn, iterations = 100000) {
  console.log(`\n${description}`);
  
  const rustOps = benchmark('rust', rustFn, iterations);
  const jsOps = benchmark('js', jsFn, iterations);
  
  const speedup = rustOps / jsOps;
  const winner = speedup > 1 ? 'Rust' : 'JavaScript';
  const factor = speedup > 1 ? speedup : (1 / speedup);
  
  console.log(`  Rust (protobufjs-rslux)    ${formatNumber(rustOps).padStart(15)} ops/sec`);
  console.log(`  JavaScript (protobufjs)    ${formatNumber(jsOps).padStart(15)} ops/sec`);
  
  if (Math.abs(speedup - 1) < 0.05) {
    console.log(`  ⚖️  Similar performance (within 5%)`);
  } else {
    console.log(`  ⚡ ${winner} is ${factor.toFixed(2)}x faster`);
  }
  
  return { rustOps, jsOps, speedup };
}

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║     protobufjs-rslux vs protobufjs Comparison Benchmark       ║');
console.log('╚════════════════════════════════════════════════════════════════╝');

console.log('\n=== Varint Encoding ===');

comparePerformance(
  'Small varint (1 byte)',
  () => {
    const w = new RustWriter();
    w.uint32(42);
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    w.uint32(42);
    w.finish();
  }
);

comparePerformance(
  'Medium varint (2 bytes)',
  () => {
    const w = new RustWriter();
    w.uint32(12345);
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    w.uint32(12345);
    w.finish();
  }
);

comparePerformance(
  'Large varint (5 bytes)',
  () => {
    const w = new RustWriter();
    w.uint32(0xFFFFFFFF);
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    w.uint32(0xFFFFFFFF);
    w.finish();
  }
);

console.log('\n=== String Encoding ===');

comparePerformance(
  'Short string (5 chars)',
  () => {
    const w = new RustWriter();
    w.string('hello');
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    w.string('hello');
    w.finish();
  }
);

comparePerformance(
  'Medium string (30 chars)',
  () => {
    const w = new RustWriter();
    w.string('The quick brown fox jumps over');
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    w.string('The quick brown fox jumps over');
    w.finish();
  }
);

comparePerformance(
  'Long string (100 chars)',
  () => {
    const str = 'A'.repeat(100);
    const w = new RustWriter();
    w.string(str);
    w.finish();
  },
  () => {
    const str = 'A'.repeat(100);
    const w = protobuf.Writer.create();
    w.string(str);
    w.finish();
  }
);

console.log('\n=== Fixed-Size Types ===');

comparePerformance(
  'Fixed32',
  () => {
    const w = new RustWriter();
    w.fixed32(0x12345678);
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    w.fixed32(0x12345678);
    w.finish();
  }
);

comparePerformance(
  'Fixed64',
  () => {
    const w = new RustWriter();
    w.fixed64(0x123456789abcdef0);
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    w.fixed64(0x123456789abcdef0);
    w.finish();
  }
);

comparePerformance(
  'Float',
  () => {
    const w = new RustWriter();
    w.float(3.14159);
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    w.float(3.14159);
    w.finish();
  }
);

comparePerformance(
  'Double',
  () => {
    const w = new RustWriter();
    w.double(3.14159265359);
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    w.double(3.14159265359);
    w.finish();
  }
);

console.log('\n=== Complex Messages ===');

const results = [];

results.push(comparePerformance(
  'Small Message (10 fields) - Encoding',
  () => {
    const w = new RustWriter();
    for (let i = 0; i < 10; i++) {
      w.uint32(i);
    }
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    for (let i = 0; i < 10; i++) {
      w.uint32(i);
    }
    w.finish();
  }
));

// Prepare buffers for decoding tests
const rustSmallBuf = (() => {
  const w = new RustWriter();
  for (let i = 0; i < 10; i++) w.uint32(i);
  return w.finish();
})();

const jsSmallBuf = (() => {
  const w = protobuf.Writer.create();
  for (let i = 0; i < 10; i++) w.uint32(i);
  return w.finish();
})();

results.push(comparePerformance(
  'Small Message (10 fields) - Decoding',
  () => {
    const r = new RustReader(rustSmallBuf);
    for (let i = 0; i < 10; i++) {
      r.uint32();
    }
  },
  () => {
    const r = protobuf.Reader.create(jsSmallBuf);
    for (let i = 0; i < 10; i++) {
      r.uint32();
    }
  }
));

results.push(comparePerformance(
  'Medium Message (100 fields) - Encoding',
  () => {
    const w = new RustWriter();
    for (let i = 0; i < 100; i++) {
      w.uint32(i);
    }
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    for (let i = 0; i < 100; i++) {
      w.uint32(i);
    }
    w.finish();
  },
  10000
));

const rustMediumBuf = (() => {
  const w = new RustWriter();
  for (let i = 0; i < 100; i++) w.uint32(i);
  return w.finish();
})();

const jsMediumBuf = (() => {
  const w = protobuf.Writer.create();
  for (let i = 0; i < 100; i++) w.uint32(i);
  return w.finish();
})();

results.push(comparePerformance(
  'Medium Message (100 fields) - Decoding',
  () => {
    const r = new RustReader(rustMediumBuf);
    for (let i = 0; i < 100; i++) {
      r.uint32();
    }
  },
  () => {
    const r = protobuf.Reader.create(jsMediumBuf);
    for (let i = 0; i < 100; i++) {
      r.uint32();
    }
  },
  10000
));

// Mixed-type message
results.push(comparePerformance(
  'Mixed-Type Message - Encoding',
  () => {
    const w = new RustWriter();
    w.uint32(42);
    w.string('John Doe');
    w.uint32(30);
    w.string('john@example.com');
    w.bool(true);
    w.double(1234.56);
    w.fixed32(0xdeadbeef);
    w.finish();
  },
  () => {
    const w = protobuf.Writer.create();
    w.uint32(42);
    w.string('John Doe');
    w.uint32(30);
    w.string('john@example.com');
    w.bool(true);
    w.double(1234.56);
    w.fixed32(0xdeadbeef);
    w.finish();
  }
));

const rustMixedBuf = (() => {
  const w = new RustWriter();
  w.uint32(42);
  w.string('John Doe');
  w.uint32(30);
  w.string('john@example.com');
  w.bool(true);
  w.double(1234.56);
  w.fixed32(0xdeadbeef);
  return w.finish();
})();

const jsMixedBuf = (() => {
  const w = protobuf.Writer.create();
  w.uint32(42);
  w.string('John Doe');
  w.uint32(30);
  w.string('john@example.com');
  w.bool(true);
  w.double(1234.56);
  w.fixed32(0xdeadbeef);
  return w.finish();
})();

results.push(comparePerformance(
  'Mixed-Type Message - Decoding',
  () => {
    const r = new RustReader(rustMixedBuf);
    r.uint32();
    r.string();
    r.uint32();
    r.string();
    r.bool();
    r.double();
    r.fixed32();
  },
  () => {
    const r = protobuf.Reader.create(jsMixedBuf);
    r.uint32();
    r.string();
    r.uint32();
    r.string();
    r.bool();
    r.double();
    r.fixed32();
  }
));

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                       Summary Statistics                       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Calculate average speedup for complex messages
const avgSpeedup = results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
const encodingTests = results.filter((_, i) => i % 2 === 0);
const decodingTests = results.filter((_, i) => i % 2 === 1);

const avgEncodingSpeedup = encodingTests.reduce((sum, r) => sum + r.speedup, 0) / encodingTests.length;
const avgDecodingSpeedup = decodingTests.reduce((sum, r) => sum + r.speedup, 0) / decodingTests.length;

console.log(`Average Performance Across Complex Message Tests:`);
console.log(`  Encoding: ${avgEncodingSpeedup >= 1 ? `${avgEncodingSpeedup.toFixed(2)}x faster` : `${(1/avgEncodingSpeedup).toFixed(2)}x slower`} (Rust vs JS)`);
console.log(`  Decoding: ${avgDecodingSpeedup >= 1 ? `${avgDecodingSpeedup.toFixed(2)}x faster` : `${(1/avgDecodingSpeedup).toFixed(2)}x slower`} (Rust vs JS)`);
console.log(`  Overall: ${avgSpeedup >= 1 ? `${avgSpeedup.toFixed(2)}x faster` : `${(1/avgSpeedup).toFixed(2)}x slower`} (Rust vs JS)`);

console.log('\n✅ Binary Compatibility Check:');
console.log(`  Rust message size: ${rustMixedBuf.length} bytes`);
console.log(`  JavaScript message size: ${jsMixedBuf.length} bytes`);
console.log(`  ${rustMixedBuf.equals(jsMixedBuf) ? '✓ Identical binary output' : '✗ Binary mismatch'}`);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                     Benchmark Complete                         ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('Note: Performance differences are expected due to FFI overhead.');
console.log('Rust advantages become more apparent with:');
console.log('  - Sustained batch processing');
console.log('  - Integration with other Rust components');
console.log('  - Predictable memory usage patterns');
console.log('  - Large message processing where FFI overhead is amortized\n');
